import { betterAuth } from "better-auth";
import { readCloudStore, writeAndVerifyCloudStore, isUserDeleted } from "./server-user-store.js";

/**
 * Custom Cloud-Synced Database Adapter Factory for Better Auth
 * Ensures Better Auth users, sessions, accounts, and credentials persist
 * centrally and stay synced with Frappe Cloud Note storage.
 */
function frappeCloudAdapter(options) {
  const adapter = {
    id: "frappe-cloud-adapter",
    transaction: async (cb) => {
      return await cb(adapter);
    },
    create: async ({ model, data }) => {
      const cloudStore = await readCloudStore();
      const users = cloudStore.users || [];
      const deleted = cloudStore.deleted || [];
      const activities = cloudStore.activities || [];
      const now = new Date().toISOString();

      if (model === "user") {
        const email = (data.email || '').trim().toLowerCase();
        const mobileNo = data.mobileNo || data.mobile_no || '';
        
        if (isUserDeleted(email, deleted) || isUserDeleted(mobileNo, deleted)) {
          throw new Error("This staff account has been deleted by Hospital Admin");
        }

        const existingIndex = users.findIndex(u => (u.email || '').toLowerCase() === email);
        const newUser = {
          id: data.id || `USER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          email: email,
          password: data.password || '',
          full_name: data.name || data.full_name || email,
          name: data.name || data.full_name || email,
          mobile_no: mobileNo,
          roles: data.role ? [data.role] : (data.roles || ['Staff Member']),
          role: data.role || (data.roles?.[0]) || 'Staff Member',
          permissions: data.permissions || ['*'],
          department: data.department || '',
          designation: data.designation || '',
          frappeStaffId: data.frappeStaffId || '',
          active: data.active !== undefined ? data.active : true,
          emailVerified: data.emailVerified || false,
          createdAt: data.createdAt || now,
          updatedAt: now
        };

        if (existingIndex >= 0) {
          users[existingIndex] = { ...users[existingIndex], ...newUser };
        } else {
          users.push(newUser);
        }

        await writeAndVerifyCloudStore(users, deleted, activities);
        return newUser;
      }

      if (model === "session") {
        const sessions = cloudStore.sessions || [];
        const newSession = {
          id: data.id || `SESS-${Date.now()}`,
          userId: data.userId,
          token: data.token || data.sessionToken,
          expiresAt: data.expiresAt,
          ipAddress: data.ipAddress || '',
          userAgent: data.userAgent || '',
          createdAt: now,
          updatedAt: now
        };
        const updatedSessions = [newSession, ...sessions.filter(s => s.id !== newSession.id)].slice(0, 200);
        await writeAndVerifyCloudStore(users, deleted, activities, updatedSessions);
        return newSession;
      }

      return { id: data.id || `REC-${Date.now()}`, ...data };
    },

    findOne: async ({ model, where }) => {
      const cloudStore = await readCloudStore();
      const users = cloudStore.users || [];
      const deleted = cloudStore.deleted || [];

      if (model === "user") {
        let targetUser = null;
        if (Array.isArray(where)) {
          for (const field of where) {
            if (field.field === "email") {
              const searchEmail = (field.value || '').trim().toLowerCase();
              targetUser = users.find(u => (u.email || '').trim().toLowerCase() === searchEmail);
            } else if (field.field === "id") {
              targetUser = users.find(u => u.id === field.value);
            }
            if (targetUser) break;
          }
        } else if (typeof where === 'object') {
          if (where.email) {
            const searchEmail = (where.email || '').trim().toLowerCase();
            targetUser = users.find(u => (u.email || '').trim().toLowerCase() === searchEmail);
          } else if (where.id) {
            targetUser = users.find(u => u.id === where.id);
          }
        }

        if (targetUser && (isUserDeleted(targetUser.email, deleted) || isUserDeleted(targetUser.mobile_no, deleted))) {
          return null;
        }

        if (targetUser) {
          return {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.full_name || targetUser.name || targetUser.email,
            full_name: targetUser.full_name || targetUser.name || targetUser.email,
            mobileNo: targetUser.mobile_no || '',
            mobile_no: targetUser.mobile_no || '',
            role: targetUser.role || (targetUser.roles?.[0]) || 'Staff Member',
            roles: targetUser.roles || ['Staff Member'],
            department: targetUser.department || '',
            designation: targetUser.designation || '',
            frappeStaffId: targetUser.frappeStaffId || '',
            active: targetUser.active !== false,
            password: targetUser.password,
            createdAt: targetUser.createdAt || new Date().toISOString(),
            updatedAt: targetUser.updatedAt || new Date().toISOString()
          };
        }
        return null;
      }

      if (model === "session") {
        const sessions = cloudStore.sessions || [];
        if (Array.isArray(where)) {
          for (const field of where) {
            if (field.field === "token") {
              return sessions.find(s => s.token === field.value) || null;
            } else if (field.field === "id") {
              return sessions.find(s => s.id === field.value) || null;
            }
          }
        } else if (typeof where === 'object') {
          if (where.token) return sessions.find(s => s.token === where.token) || null;
          if (where.id) return sessions.find(s => s.id === where.id) || null;
        }
        return null;
      }

      return null;
    },

    findMany: async ({ model }) => {
      const cloudStore = await readCloudStore();
      if (model === "user") return cloudStore.users || [];
      if (model === "session") return cloudStore.sessions || [];
      return [];
    },

    update: async ({ model, where, data }) => {
      const cloudStore = await readCloudStore();
      const users = cloudStore.users || [];
      const deleted = cloudStore.deleted || [];
      const activities = cloudStore.activities || [];

      if (model === "user") {
        let userIndex = -1;
        if (Array.isArray(where)) {
          for (const field of where) {
            if (field.field === "id") {
              userIndex = users.findIndex(u => u.id === field.value);
            } else if (field.field === "email") {
              userIndex = users.findIndex(u => (u.email || '').toLowerCase() === (field.value || '').toLowerCase());
            }
            if (userIndex >= 0) break;
          }
        } else if (typeof where === 'object') {
          if (where.id) userIndex = users.findIndex(u => u.id === where.id);
          else if (where.email) userIndex = users.findIndex(u => (u.email || '').toLowerCase() === (where.email || '').toLowerCase());
        }

        if (userIndex >= 0) {
          users[userIndex] = { ...users[userIndex], ...data, updatedAt: new Date().toISOString() };
          await writeAndVerifyCloudStore(users, deleted, activities);
          return users[userIndex];
        }
      }
      return null;
    },

    delete: async ({ model, where }) => {
      const cloudStore = await readCloudStore();
      const users = cloudStore.users || [];
      const deleted = cloudStore.deleted || [];
      const activities = cloudStore.activities || [];

      if (model === "user") {
        if (Array.isArray(where)) {
          for (const field of where) {
            if (field.field === "id" || field.field === "email") {
              const val = (field.value || '').trim();
              if (val) deleted.push(val);
            }
          }
        } else if (typeof where === 'object') {
          const val = (where.id || where.email || '').trim();
          if (val) deleted.push(val);
        }
        await writeAndVerifyCloudStore(users, deleted, activities);
        return true;
      }
      return true;
    }
  };
  return adapter;
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "hospital_erp_better_auth_secret_key_2026_super_secure_key",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: frappeCloudAdapter,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6
  },
  user: {
    additionalFields: {
      mobileNo: { type: "string", required: false },
      role: { type: "string", required: false, defaultValue: "Staff Member" },
      department: { type: "string", required: false },
      designation: { type: "string", required: false },
      frappeStaffId: { type: "string", required: false },
      active: { type: "boolean", required: false, defaultValue: true }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7
    }
  }
});
