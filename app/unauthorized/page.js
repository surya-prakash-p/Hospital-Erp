"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const userRole = user?.role || user?.roles?.[0] || 'Staff Member';

  let homePath = '/';
  if (userRole === 'Pharmacist') homePath = '/pharmacy';
  else if (userRole === 'Doctor') homePath = '/consultation';
  else if (userRole === 'Lab Technician') homePath = '/lab';
  else if (userRole === 'Receptionist') homePath = '/reception';
  else if (userRole === 'Billing Clerk') homePath = '/billing';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">403 - Access Forbidden</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have permission to access this module or page. Your current logged-in role is:
            <span className="block mt-1 font-bold text-indigo-600 uppercase tracking-wider text-[11px] bg-indigo-50 px-2 py-1 rounded-md max-w-fit mx-auto border border-indigo-200">
              {userRole}
            </span>
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href={homePath}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition-all"
          >
            <Home className="w-4 h-4" /> Return to My Workspace
          </Link>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
