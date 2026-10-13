import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { signIn, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      {/* Background decoration */}
      <div className="gradient-bg" aria-hidden="true" />

      <div className="w-full max-w-md animate-fade-in space-y-6">
        {/* Brand identity header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007267] to-[#004d40] shadow-lg shadow-[#007267]/20">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="6" y1="10" x2="14" y2="10" />
              <line x1="6" y1="14" x2="10" y2="14" />
              <circle cx="17" cy="13" r="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Check Writer
          </h1>
          <p className="text-sm text-slate-500">
            Staff Cheque Portal
          </p>
        </div>

        {/* Configuration notice if Supabase is not yet configured */}
        {!isConfigured && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 shadow-sm space-y-2 animate-fade-in"
          >
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              Supabase Project Connection Required
            </div>
            <p className="leading-relaxed">
              To activate login, insert your Supabase project credentials in your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> file:
            </p>
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
              VITE_SUPABASE_URL=https://your-project.supabase.co<br />
              VITE_SUPABASE_ANON_KEY=eyJhbGci...
            </div>
            <p className="text-[11px] text-amber-700">
              User accounts are created directly in your Supabase Auth dashboard by the administrator.
            </p>
          </div>
        )}

        {/* Login form card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Sign In</h2>
              <p className="text-xs text-slate-500">Authorized personnel only</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-[#007267]" />
              Secured
            </span>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-fade-in"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Staff Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || !isConfigured}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#007267] focus:outline-none focus:ring-2 focus:ring-[#007267]/25 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !isConfigured}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#007267] focus:outline-none focus:ring-2 focus:ring-[#007267]/25 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || !isConfigured}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#007267] text-sm font-semibold text-white shadow-md shadow-[#007267]/20 transition-all hover:bg-[#009688] active:bg-[#004d40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Verifying Credentials&hellip;
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Cheque accounts are managed by administrators. No self-registration.
        </p>
      </div>
    </div>
  );
}
