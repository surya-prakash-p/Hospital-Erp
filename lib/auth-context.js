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

const FALLBACK_ACCOUNTS = [
  {
    id: 'STAFF-ADMIN-1',
    employeeId: 'TH001',
    employee_id: 'TH001',
    frappeStaffId: 'TH001',
    email: 'suryapraks588@gmail.com',
    mobile_no: '8270173588',
    password: 'Admin@2026',
    full_name: 'Hospital Admin',
    name: 'Hospital Admin',
    role: 'Hospital Admin',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'Hospital Administration',
    designation: 'Chief Administrator'
  },
  {
    id: 'STAFF-MGR-1',
    employeeId: 'TH002',
    employee_id: 'TH002',
    frappeStaffId: 'TH002',
    email: 'manager@thangamhospital.com',
    mobile_no: '8073788034',
    password: '123456',
    full_name: 'Hospital Manager',
    name: 'Hospital Manager',
    role: 'Hospital Admin',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'Hospital Administration',
    designation: 'General Manager'
  },
  {
    id: 'STAFF-9682',
    employeeId: 'TH003',
    employee_id: 'TH003',
    frappeStaffId: 'TH003',
    email: 'saranya@thangamhospital.com',
    mobile_no: '',
    password: 'Admin@123',
    full_name: 'Saranya',
    name: 'Saranya',
    role: 'Hospital Admin',
    roles: ['Hospital Admin'],
    permissions: ['*'],
    department: 'General Medicine',
    designation: 'Hospital Admin'
  },
  {
    id: 'STAFF-4514',
    employeeId: 'TH004',
    employee_id: 'TH004',
    frappeStaffId: 'TH004',
    email: 'pharmacist@thangamhospital.com',
    mobile_no: '',
    password: '123456',
    full_name: 'Demo Pharmacist',
    name: 'Demo Pharmacist',
    role: 'Pharmacist',
    roles: ['Pharmacist'],
    permissions: [],
    department: 'Pharmacy',
    designation: 'Pharmacist'
  },
  {
    id: 'STAFF-6883',
    employeeId: 'TH005',
    employee_id: 'TH005',
    frappeStaffId: 'TH005',
    email: 'doctor@thangamhospital.com',
    mobile_no: '',
    password: '123456',
    full_name: 'Dr. Testing',
    name: 'Dr. Testing',
    role: 'Doctor',
    roles: ['Doctor'],
    permissions: [],
    department: 'General Medicine',
    designation: 'Doctor'
  },
  {
    id: 'STAFF-6382',
    employeeId: 'TH006',
    employee_id: 'TH006',
    frappeStaffId: 'TH006',
    email: 'reception@thangamhospital.com',
    mobile_no: '',
    password: '123789',
    full_name: 'Vishnu',
    name: 'Vishnu',
    role: 'Receptionist',
    roles: ['Receptionist'],
    permissions: [],
    department: 'Reception',
    designation: 'Receptionist'
  }
];

function checkLocalUserCredentials(identifier, password) {
  if (!identifier || !password) return null;
  const cleanInput = identifier.trim().toLowerCase();
  const cleanPwd = password.trim();

  let storedUsers = [];
  if (typeof window !== 'undefined') {
    try {
      const localStaff = localStorage.getItem('hospital_staff_users');
      if (localStaff) {
        storedUsers = JSON.parse(localStaff) || [];
      }
    } catch (e) {}
  }

  const normalizedCleanInput = /^th/i.test(cleanInput) ? cleanInput.replace(/o/g, '0') : cleanInput;
  const cleanInputAlphaNum = normalizedCleanInput.replace(/[^a-z0-9]/g, '');

  const allAccounts = [...storedUsers, ...FALLBACK_ACCOUNTS];

  const matchingAccounts = allAccounts.filter(u => {
    const empId = (u.employeeId || u.employee_id || u.frappeStaffId || u.id || '').trim().toLowerCase();
    const normalizedEmpId = /^th/i.test(empId) ? empId.replace(/o/g, '0') : empId;
    const cleanEmpId = normalizedEmpId.replace(/[^a-z0-9]/g, '');

    const email = (u.email || '').trim().toLowerCase();
    const mobile = (u.mobile_no || u.mobileNo || '').replace(/\D/g, '');
    const cleanMobileInput = cleanInput.replace(/\D/g, '');

    const idMatch = empId && (
      empId === cleanInput ||
      normalizedEmpId === normalizedCleanInput ||
      cleanEmpId === cleanInputAlphaNum ||
      (cleanInputAlphaNum.startsWith('th') && (cleanEmpId.endsWith(cleanInputAlphaNum.replace(/^th/, '')) || cleanInputAlphaNum.endsWith(cleanEmpId.replace(/^th/, ''))))
    );
    const emailMatch = email && email === cleanInput;
    const mobileMatch = cleanMobileInput && cleanMobileInput.length >= 7 && mobile && mobile.includes(cleanMobileInput);

    return idMatch || emailMatch || mobileMatch;
  });

  const matched = matchingAccounts.find(u => (u.password || '').trim() === cleanPwd);

  if (matched) {
    const empId = matched.employeeId || matched.employee_id || matched.frappeStaffId || matched.id;
    return {
      id: matched.id || `USER-${Date.now()}`,
      employeeId: empId,
      employee_id: empId,
      frappeStaffId: empId,
      email: matched.email || '',
      full_name: matched.full_name || matched.name || empId,
      name: matched.full_name || matched.name || empId,
      mobile_no: matched.mobile_no || '',
      role: matched.role || matched.roles?.[0] || 'Staff Member',
      roles: matched.roles || [matched.role || 'Staff Member'],
      permissions: matched.permissions || [],
      department: matched.department || '',
      designation: matched.designation || '',
      active: true
    };
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        let sessionUser = null;

        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await res.json().catch(() => null);
              if (data?.authenticated && data?.user) {
                sessionUser = data.user;
              }
            }
          }
        } catch (e) {
          console.warn('API /api/auth/me check failed, using local session fallback:', e);
        }

        if (!sessionUser && typeof window !== 'undefined') {
          const localStr = localStorage.getItem('hospital_erp_user_session');
          if (localStr) {
            try {
              const parsed = JSON.parse(localStr);
              if (parsed && (parsed.employeeId || parsed.email || parsed.id)) {
                sessionUser = parsed;
              }
            } catch (e) {}
          }
        }

        setUser(sessionUser);
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const navigateByRole = (userObj) => {
    const userRole = userObj?.role || userObj?.roles?.[0] || '';
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
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (!user && pathname !== '/login' && pathname !== '/unauthorized') {
          router.push('/login');
        } else if (user && pathname === '/login') {
          navigateByRole(user);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, loading, pathname, router]);

  const login = async (employeeId, password) => {
    const rawId = (employeeId || '').trim();
    const cleanId = /^th/i.test(rawId) ? rawId.replace(/o/gi, '0') : rawId;
    const cleanPwd = (password || '').trim();

    if (!cleanId || !cleanPwd) {
      throw new Error('Please enter your Employee ID and password');
    }

    let res = null;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: cleanId, identifier: cleanId, password: cleanPwd }),
      });
    } catch (netErr) {
      console.warn('Fetch error calling /api/auth/login:', netErr);
    }

    if (res) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            setUser(data.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('hospital_erp_user_session', JSON.stringify(data.user));
            }

            // Record User Login Audit Log
            try {
              fetch('/api/logs/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'auth',
                  action: 'User Login',
                  description: `${data.user.full_name || data.user.name} (${data.user.employeeId}) logged into Hospital ERP`,
                  actor: {
                    employeeId: data.user.employeeId,
                    name: data.user.full_name || data.user.name,
                    role: data.user.role || data.user.roles?.[0] || 'Staff Member',
                    email: data.user.email || '',
                    department: data.user.department || ''
                  },
                  target: 'ERP Portal Session'
                })
              }).catch(() => null);
            } catch (e) {}

            navigateByRole(data.user);
            return data.user;
          } else if (data?.error) {
            throw new Error(data.error);
          }
        } catch (jsonErr) {
          if (jsonErr.message && !jsonErr.message.includes('Unexpected token')) {
            throw jsonErr;
          }
          console.warn('JSON parse error from /api/auth/login:', jsonErr);
        }
      } else {
        const text = await res.text().catch(() => '');
        console.warn(`Non-JSON response from /api/auth/login (HTTP ${res.status}):`, text.substring(0, 200));
      }
    }

    // Client local fallback check
    const localUser = checkLocalUserCredentials(cleanId, cleanPwd);
    if (localUser) {
      setUser(localUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hospital_erp_user_session', JSON.stringify(localUser));
      }

      // Record User Login Audit Log
      try {
        fetch('/api/logs/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'auth',
            action: 'User Login',
            description: `${localUser.full_name || localUser.name} (${localUser.employeeId}) logged into Hospital ERP`,
            actor: {
              employeeId: localUser.employeeId,
              name: localUser.full_name || localUser.name,
              role: localUser.role || localUser.roles?.[0] || 'Staff Member',
              email: localUser.email || '',
              department: localUser.department || ''
            },
            target: 'ERP Portal Session'
          })
        }).catch(() => null);
      } catch (e) {}

      navigateByRole(localUser);
      return localUser;
    }

    throw new Error('Invalid Employee ID or password.');
  };

  const logout = async () => {
    if (user) {
      try {
        fetch('/api/logs/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'auth',
            action: 'User Logout',
            description: `${user.full_name || user.name} (${user.employeeId}) logged out of Hospital ERP`,
            actor: {
              employeeId: user.employeeId,
              name: user.full_name || user.name,
              role: user.role || user.roles?.[0] || 'Staff Member',
              email: user.email || '',
              department: user.department || ''
            },
            target: 'Session End'
          })
        }).catch(() => null);
      } catch (e) {}
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hospital_erp_user_session');
    }
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

