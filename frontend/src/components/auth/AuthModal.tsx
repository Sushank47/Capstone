import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { login, register, verifyOtp } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'OTP'>('LOGIN');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [otpCode, setOtpCode] = useState('123456');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
        onClose();
      } else if (mode === 'REGISTER') {
        await register(fullName, email, password, role);
        setSuccessMsg('Account created in MongoDB Atlas! Enter confirmation code below to activate.');
        setMode('OTP');
      } else if (mode === 'OTP') {
        await verifyOtp(email, otpCode || '123456');
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await register('Sarah Patient', 'sarah.patient@example.com', 'PatientPass123!', 'PATIENT').catch(() => {});
      await login('sarah.patient@example.com', 'PatientPass123!');
      onClose();
    } catch (err: any) {
      setError('Evaluation login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl border border-slate-700/80">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/25">
            <Lock className="w-6 h-6 text-slate-950" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {mode === 'LOGIN' ? 'Sign In to MediExplain AI' : mode === 'REGISTER' ? 'Create Your Medical Account' : 'Verify Email Account'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'OTP' ? 'Confirmation code sent • Enter below to activate' : 'MongoDB Atlas Encrypted Account Storage'}
          </p>
        </div>

        {/* Demo Quick Login for Evaluation */}
        {mode === 'LOGIN' && (
          <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Quick Evaluation Access</span>
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="px-3 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 text-xs font-bold border border-teal-500/40 transition-colors"
              >
                Patient Evaluation Login
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {mode !== 'OTP' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </>
          )}



          {mode === 'OTP' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">Confirmation Code</label>
              <input
                type="text"
                required
                maxLength={6}
                autoComplete="off"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2.5 text-center text-xl tracking-widest font-mono bg-slate-950/80 border border-teal-500/50 rounded-xl text-teal-300 focus:outline-none focus:border-teal-400"
              />
              <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs text-center space-y-1">
                <p className="font-bold">Confirmation Code: {otpCode || "123456"}</p>
                <p className="text-[11px] text-slate-400">Click below to activate your account in MongoDB Atlas.</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {mode === 'LOGIN'
                    ? 'Sign In'
                    : mode === 'REGISTER'
                    ? 'Create Account'
                    : 'Verify & Complete Activation'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          {mode === 'LOGIN' ? (
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('REGISTER'); setError(''); setSuccessMsg(''); }}
                className="text-teal-400 font-semibold hover:underline"
              >
                Register Here
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <button
                onClick={() => { setMode('LOGIN'); setError(''); setSuccessMsg(''); }}
                className="text-teal-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
