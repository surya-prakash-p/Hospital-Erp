import { auth } from "./auth.js";
import { NextResponse } from "next/server";
import { readCloudStore, isUserDeleted } from "./server-user-store.js";

/**
 * Server-side API Security Guard using Better Auth Session & Cookies
 * Verifies authentication, active account status, and role/permission authorization.
 *
 * @param {Request} req Next.js Request object
 * @param {Array<string>} allowedRoles Optional list of permitted roles (e.g., ['Hospital Admin', 'System Manager'])
 * @returns {Promise<{user: Object, session: Object, errorResponse: NextResponse|null}>}
 */
export async function requireAuth(req, allowedRoles = []) {
  try {
    let user = null;
    let session = null;

    // 1. Try Better Auth session API
    try {
      session = await auth.api.getSession({ headers: req.headers });
      if (session && session.user) {
        user = session.user;
      }
    } catch (e) {}

    // 2. Fallback to session cookies with URL decoding support
    if (!user) {
      const rawCookieVal = req.cookies?.get?.('better-auth.session_token')?.value || 
                           req.cookies?.get?.('hospital_erp_user')?.value;
      if (rawCookieVal) {
        try {
          const decoded = decodeURIComponent(rawCookieVal);
          user = JSON.parse(decoded);
        } catch (e) {
          try {
            user = JSON.parse(rawCookieVal);
          } catch (e2) {}
        }
      }
    }

    // 3. Fallback to raw Cookie header parsing
    if (!user) {
      const cookieHeader = req.headers?.get?.('cookie') || '';
      const match = cookieHeader.match(/(?:hospital_erp_user|better-auth\.session_token)=([^;]+)/);
      if (match && match[1]) {
        try {
          const decoded = decodeURIComponent(match[1]);
          user = JSON.parse(decoded);
        } catch (e) {
          try {
            user = JSON.parse(match[1]);
          } catch (e2) {}
        }
      }
    }

    if (!user) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "Unauthorized: Active Better Auth session required" },
          { status: 401 }
        )
      };
    }

    // Fresh active & deleted status check from cloud store
    const userIdentifier = user.email || user.mobile_no || user.mobileNo;
    const cloudStore = await readCloudStore().catch(() => null);
    if (cloudStore) {
      const serverDeleted = cloudStore.deleted || [];
      if (isUserDeleted(userIdentifier, serverDeleted)) {
        return {
          errorResponse: NextResponse.json(
            { success: false, error: "Forbidden: Account deleted" },
            { status: 401 }
          )
        };
      }
    }

    if (user.active === false) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "Forbidden: Account deactivated" },
          { status: 403 }
        )
      };
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRoles = Array.isArray(user.roles) && user.roles.length > 0 
        ? user.roles 
        : (user.role ? [user.role] : []);
      const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];

      const isAdmin = user.role === 'Hospital Admin' || 
                      user.role === 'System Manager' ||
                      userRoles.includes('Hospital Admin') || 
                      userRoles.includes('System Manager');

      const hasRolePermission = userRoles.some(r => allowedRoles.includes(r)) || 
                                allowedRoles.includes(user.role);

      const hasExplicitPermission = userPermissions.includes('*') ||
                                    userPermissions.some(p => {
                                      const pClean = (p || '').toLowerCase().replace('/', '').trim();
                                      return allowedRoles.some(r => {
                                        const rClean = r.toLowerCase().replace('/', '').trim();
                                        return pClean === rClean || pClean.includes(rClean) || rClean.includes(pClean);
                                      });
                                    });

      const hasPermission = isAdmin || hasRolePermission || hasExplicitPermission;

      if (!hasPermission) {
        return {
          errorResponse: NextResponse.json(
            { success: false, error: `Forbidden: Access restricted to ${allowedRoles.join(', ')}` },
            { status: 403 }
          )
        };
      }
    }

    return { user, session: session || { user }, errorResponse: null };
  } catch (err) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Authentication verification failed" },
        { status: 401 }
      )
    };
  }
}
