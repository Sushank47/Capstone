import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole, Specialization } from '../../types';
import { api } from '../../services/api';
import { X, Lock, Mail, User as UserIcon, KeyRound, Sparkles, CheckCircle2, Eye, EyeOff, Stethoscope, Award, Building2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { login, register, verifyOtp } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'PATIENT_REGISTER' | 'DOCTOR_REGISTER' | 'OTP'>('LOGIN');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');

  // Doctor Specific Fields
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState<Specialization>('Cardiology');
  const [experienceYears, setExperienceYears] = useState(10);
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');

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
      } else if (mode === 'PATIENT_REGISTER') {
        await register(fullName, email, password, 'PATIENT');
        setSuccessMsg('Account created in MongoDB Atlas! Enter confirmation code below to activate.');
        setMode('OTP');
      } else if (mode === 'DOCTOR_REGISTER') {
        if (!medicalLicenseNumber || !hospitalAffiliation) {
          setError('Please fill in your Medical License Number and Hospital Affiliation.');
          setLoading(false);
          return;
        }
        await api.post('/api/doctors/register', {
          full_name: fullName,
          email,
          password,
          medical_license_number: medicalLicenseNumber,
          specialization,
          experience_years: experienceYears,
          hospital_affiliation: hospitalAffiliation,
          bio: `Verified specialist in ${specialization}. Affiliated with ${hospitalAffiliation}.`
        });
        await login(email, password);
        setSuccessMsg('Doctor License Verified & Account Activated!');
        setTimeout(() => onClose(), 500);
      } else if (mode === 'OTP') {
        await verifyOtp(email, otpCode);
        setSuccessMsg('Email verified & authenticated!');
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPatient = async () => {
    setLoading(true);
    setError('');
    try {
      await register('Sarah Patient', 'sarah.patient@example.com', 'PatientPass123!', 'PATIENT').catch(() => {});
      await login('sarah.patient@example.com', 'PatientPass123!');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login with Sarah Patient account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoDoctor1 = async () => {
    setLoading(true);
    setError('');
    try {
      await login('dr.marcus@mediexplain.ai', 'DoctorPass123!').catch(async () => {
        await api.get('/api/doctors');
        await login('dr.marcus@mediexplain.ai', 'DoctorPass123!');
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login with Doctor 1 account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoDoctor2 = async () => {
    setLoading(true);
    setError('');
    try {
      await login('dr.elena@mediexplain.ai', 'DoctorPass123!').catch(async () => {
        await api.get('/api/doctors');
        await login('dr.elena@mediexplain.ai', 'DoctorPass123!');
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login with Doctor 2 account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md dark:bg-slate-900 bg-white rounded-2xl p-6 shadow-2xl border dark:border-slate-700/80 border-slate-200 transition-colors duration-200 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {mode === 'LOGIN' ? 'Sign In' : mode === 'PATIENT_REGISTER' ? 'Patient Sign Up' : mode === 'DOCTOR_REGISTER' ? 'Doctor Portal Registration' : 'Verify Email OTP'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Azure Key Vault & Medical License Verification</p>
          </div>
        </div>

        {/* 1-Click Evaluation Login Buttons */}
        {mode === 'LOGIN' && (
          <div className="mb-6 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-2.5">
            <p className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> 1-Click Evaluation Login Options
            </p>
            
            <button
              type="button"
              onClick={handleDemoPatient}
              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition-all text-center"
            >
              Patient Login (Sarah Patient)
            </button>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleDemoDoctor1}
                className="py-2 px-2.5 rounded-lg bg-slate-900 border border-teal-500/40 text-teal-300 hover:bg-slate-800 font-bold text-[11px] shadow-sm transition-all text-center truncate"
              >
                Doctor 1: Dr. Marcus (Cardiology)
              </button>

              <button
                type="button"
                onClick={handleDemoDoctor2}
                className="py-2 px-2.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-slate-800 font-bold text-[11px] shadow-sm transition-all text-center truncate"
              >
                Doctor 2: Dr. Elena (Endo)
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === 'PATIENT_REGISTER' || mode === 'DOCTOR_REGISTER') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={mode === 'DOCTOR_REGISTER' ? "Dr. Marcus Vance, MD" : "Sarah Patient"}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {mode === 'DOCTOR_REGISTER' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Medical License Number</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-teal-600 dark:text-teal-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={medicalLicenseNumber}
                    onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                    placeholder="e.g. MD-88492-CAR"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Specialization</label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value as Specialization)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hospital / Clinic Affiliation</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={hospitalAffiliation}
                    onChange={(e) => setHospitalAffiliation(e.target.value)}
                    placeholder="St. Jude Heart Institute"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </>
          )}

          {(mode === 'LOGIN' || mode === 'PATIENT_REGISTER' || mode === 'DOCTOR_REGISTER') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === 'DOCTOR_REGISTER' ? "doctor@mediexplain.ai" : "patient@example.com"}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'OTP' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Confirmation Code</label>
              <input
                type="text"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                Demo environment code is pre-filled. Click verify to enter.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>
                {mode === 'LOGIN'
                  ? 'Sign In to Vault'
                  : mode === 'PATIENT_REGISTER'
                  ? 'Register Patient Account'
                  : mode === 'DOCTOR_REGISTER'
                  ? 'Submit Doctor Verification'
                  : 'Verify Security Code'}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t dark:border-slate-800 border-slate-200 text-center text-xs space-y-2">
          {mode === 'LOGIN' ? (
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Need a patient account?{' '}
                <button
                  onClick={() => {
                    setMode('PATIENT_REGISTER');
                    setError('');
                  }}
                  className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                >
                  Register Patient
                </button>
              </p>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Are you a medical doctor?{' '}
                <button
                  onClick={() => {
                    setMode('DOCTOR_REGISTER');
                    setError('');
                  }}
                  className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                >
                  Register Doctor License
                </button>
              </p>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Already registered?{' '}
              <button
                onClick={() => {
                  setMode('LOGIN');
                  setError('');
                }}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
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
