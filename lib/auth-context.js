"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, signOut, getSession } from './auth-client.js';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  hasRole: (roleName) => false,
  hasPermission: (permissionName) => false,
  updateProfile: (updatedFields) => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Better Auth check error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login' && pathname !== '/unauthorized') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        const userRole = user.role || user.roles?.[0] || '';
        if (userRole === 'Lab Technician') {
          router.push('/lab');
        } else if (userRole === 'Doctor') {
          router.push('/consultation');
        } else if (userRole === 'Pharmacist') {
          router.push('/pharmacy');
        } else if (userRole === 'Receptionist') {
          router.push('/reception');
        } else if (userRole === 'Billing Clerk') {
          router.push('/billing');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (employeeId, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, identifier: employeeId, password }),
    });

    let data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data?.error || 'Invalid Employee ID or password');
    }

    const checkRes = await fetch('/api/auth/me');
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.authenticated && checkData.user) {
        setUser(checkData.user);
        const loggedUser = checkData.user;
        const userRole = loggedUser.role || loggedUser.roles?.[0] || '';

        if (userRole === 'Doctor') {
          router.push('/consultation');
        } else if (userRole === 'Lab Technician') {
          router.push('/lab');
        } else if (userRole === 'Pharmacist') {
          router.push('/pharmacy');
        } else if (userRole === 'Receptionist') {
          router.push('/reception');
        } else if (userRole === 'Billing Clerk') {
          router.push('/billing');
        } else {
          router.push('/');
        }
        return loggedUser;
      }
    }

    throw new Error('Authentication state sync failed');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setUser(null);
    router.push('/login');
  };

  const hasRole = (roleName) => {
    if (!user) return false;
    const userRole = user.role || user.roles?.[0];
    const userRoles = user.roles || (userRole ? [userRole] : []);
    if (userRoles.includes('Hospital Admin') || userRoles.includes('System Manager')) return true;
    return userRoles.includes(roleName);
  };

  const hasPermission = (permissionName) => {
    if (!user) return false;
    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (userRoles.includes('Hospital Admin') || userRoles.includes('System Manager')) return true;
    if (user.permissions?.includes('*')) return true;
    if (user.permissions?.some(p => p.toLowerCase().includes(permissionName.toLowerCase()))) return true;
    return false;
  };

  const updateProfile = (updatedFields) => {
    setUser((prevUser) => {
      return { ...(prevUser || {}), ...updatedFields };
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
