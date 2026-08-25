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

    // 2. Fallback to session cookies
    if (!user) {
      const cookie = req.cookies?.get?.('better-auth.session_token') || req.cookies?.get?.('hospital_erp_user');
      if (cookie && cookie.value) {
        try {
          user = JSON.parse(cookie.value);
        } catch (e) {}
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
      const userRoles = user.roles || (user.role ? [user.role] : []);
      const hasPermission = userRoles.some(r => 
        allowedRoles.includes(r) || r === 'Hospital Admin' || r === 'System Manager'
      );

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
