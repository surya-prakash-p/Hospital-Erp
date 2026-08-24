"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  Mail
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your Email Address or Mobile Number');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      
      {/* Outer Main Container Card */}
      <div className="w-full max-w-5xl bg-white/40 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-2xl p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT PANEL: Branding & Actual Thangam Hospital Image */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/thangam_logo.png" 
              alt="Thangam Hospital Logo" 
              className="w-12 h-12 object-contain bg-white rounded-xl p-1 shadow-md border border-slate-100 shrink-0" 
            />
            <div>
              <h1 className="text-lg font-black tracking-wider text-slate-900 leading-none">
                THANGAM
              </h1>
              <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mt-0.5">
                HOSPITALS
              </p>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Compassionate Care,<br />Advanced Technology
            </h2>
            <p className="text-sm text-slate-600 max-w-md font-normal leading-relaxed">
              Delivering exceptional healthcare with integrity, innovation, and compassion.
            </p>
          </div>

          {/* Actual Thangam Hospital Building Photo */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-white/80 group">
            <img 
              src="/thangam_hospital_building.jpg" 
              alt="Thangam Hospital Building" 
              className="w-full h-72 sm:h-80 object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
          </div>

        </div>


        {/* RIGHT PANEL: White Floating Login Card */}
        <div className="lg:col-span-6 bg-white rounded-[28px] shadow-xl border border-slate-100 p-6 sm:p-10 relative">
          
          {/* Header Row with Shield Badge */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome Back
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to access your hospital portal
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Address or Mobile Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or 10-digit mobile number"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setError('Contact Hospital IT administrator to reset password.')}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer Copyright */}
          <div className="mt-8 text-center text-[11px] text-slate-400 font-normal">
            © 2026 Thangam Hospitals. All rights reserved.
          </div>

        </div>
      </div>
    </div>
  );
}
