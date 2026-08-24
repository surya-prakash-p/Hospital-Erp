"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
        const savedUser = localStorage.getItem('hospital_user');
        const rawDel = localStorage.getItem('hospital_deleted_users');
        const localDeleted = rawDel ? JSON.parse(rawDel) : [];

        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const pEmail = (parsed.email || '').toLowerCase();
          const pMobile = (parsed.mobile_no || parsed.phone || '').replace(/\D/g, '');

          const isLocallyDeleted = localDeleted.some(d => d === pEmail || (pMobile.length >= 7 && d === pMobile));

          if (isLocallyDeleted) {
            localStorage.removeItem('hospital_user');
            setUser(null);
          } else {
            setUser(parsed);
          }
        }

        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            localStorage.setItem('hospital_user', JSON.stringify(data.user));
          } else {
            setUser(null);
            localStorage.removeItem('hospital_user');
          }
        } else {
          setUser(null);
          localStorage.removeItem('hospital_user');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        if (user.roles?.includes('Lab Technician') && !user.roles?.includes('Hospital Admin')) {
          router.push('/lab');
        } else if (user.roles?.includes('Doctor') && !user.roles?.includes('Hospital Admin')) {
          router.push('/consultation');
        } else if (user.roles?.includes('Pharmacist') && !user.roles?.includes('Hospital Admin')) {
          router.push('/pharmacy');
        } else if (user.roles?.includes('Receptionist') && !user.roles?.includes('Hospital Admin')) {
          router.push('/reception');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (identifier, password) => {
    let storedStaff = [];
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('hospital_staff_users');
        if (raw) storedStaff = JSON.parse(raw);
      }
    } catch (e) {}

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, localStaff: storedStaff }),
    });

    let data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'Invalid email/mobile number or password');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Invalid email/mobile number or password');
    }

    const loggedUser = data.user;
    setUser(loggedUser);
    localStorage.setItem('hospital_user', JSON.stringify(loggedUser));

    if (loggedUser.roles?.includes('Doctor')) {
      router.push('/consultation');
    } else if (loggedUser.roles?.includes('Lab Technician')) {
      router.push('/lab');
    } else if (loggedUser.roles?.includes('Pharmacist')) {
      router.push('/pharmacy');
    } else if (loggedUser.roles?.includes('Receptionist')) {
      router.push('/reception');
    } else {
      router.push('/');
    }

    return loggedUser;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setUser(null);
    localStorage.removeItem('hospital_user');
    router.push('/login');
  };

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('Hospital Admin') || user.roles.includes('System Manager')) return true;
    return user.roles.includes(roleName);
  };

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.roles?.includes('Hospital Admin') || user.roles?.includes('System Manager')) return true;
    if (user.permissions?.includes('*')) return true;
    if (user.permissions?.some(p => p.toLowerCase().includes(permissionName.toLowerCase()))) return true;
    return false;
  };

  const updateProfile = (updatedFields) => {
    setUser((prevUser) => {
      const updated = { ...(prevUser || {}), ...updatedFields };
      localStorage.setItem('hospital_user', JSON.stringify(updated));
      return updated;
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
