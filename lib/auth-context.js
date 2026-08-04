"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  hasRole: (roleName) => false,
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
        // Try fetching session from local storage first for speed
        const savedUser = localStorage.getItem('hospital_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to login');
    }

    const loggedUser = data.user;
    setUser(loggedUser);
    localStorage.setItem('hospital_user', JSON.stringify(loggedUser));

    if (loggedUser.roles?.includes('Lab Technician') && !loggedUser.roles?.includes('Hospital Admin')) {
      router.push('/lab');
    } else if (loggedUser.roles?.includes('Doctor') && !loggedUser.roles?.includes('Hospital Admin')) {
      router.push('/consultation');
    } else if (loggedUser.roles?.includes('Pharmacist') && !loggedUser.roles?.includes('Hospital Admin')) {
      router.push('/pharmacy');
    } else if (loggedUser.roles?.includes('Receptionist') && !loggedUser.roles?.includes('Hospital Admin')) {
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

  const updateProfile = (updatedFields) => {
    setUser((prevUser) => {
      const updated = { ...(prevUser || {}), ...updatedFields };
      localStorage.setItem('hospital_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
