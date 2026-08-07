import React, { useEffect, useState } from 'react';
import type { Doctor, Consultation } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Stethoscope, Award, Star, Building2, CheckCircle2, MessageSquare, ShieldCheck, X, LogIn, Video, Clock } from 'lucide-react';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  onOpenAuthModal: () => void;
  onConsultationRequested?: () => void;
  consultations?: Consultation[];
  onOpenConsultationRoom?: (consultation: Consultation) => void;
}

export const DoctorDirectory: React.FC<Props> = ({ onOpenAuthModal, onConsultationRequested, consultations = [], onOpenConsultationRoom }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('ALL');

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [symptomsNote, setSymptomsNote] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  const fetchDoctors = async () => {
    try {
      const queryUrl = selectedSpecialization !== 'ALL' ? `/api/doctors?specialization=${selectedSpecialization}` : '/api/doctors';
      const res = await api.get<Doctor[]>(queryUrl);
      setDoctors(res.data);
    } catch {
      console.error('Failed to load verified doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization]);

  const filteredDoctors = doctors.filter((doc, index, self) => {
    const matchesSearch =
      doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospital_affiliation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isFirstOccurrence = self.findIndex((d) => 
      (d.email && d.email.toLowerCase() === doc.email.toLowerCase()) || 
      (d.full_name && d.full_name.toLowerCase() === doc.full_name.toLowerCase())
    ) === index;

    return matchesSearch && isFirstOccurrence;
  });

  const handleRequestClick = (doctor: Doctor) => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    setSelectedDoctor(doctor);
  };

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    if (!user) {
      onOpenAuthModal();
      return;
    }

    setIsBooking(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      await api.post('/api/doctors/consultations', {
        doctor_id: selectedDoctor.id,
        symptoms_note: symptomsNote
      });
      setBookingSuccess(`Medical consultation request sent to ${selectedDoctor.full_name}!`);
      setTimeout(() => {
        setSelectedDoctor(null);
        setSymptomsNote('');
        setBookingSuccess('');
        if (onConsultationRequested) onConsultationRequested();
      }, 1500);
    } catch (err: any) {
      setBookingError(err.response?.data?.detail || 'Failed to submit consultation request.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="clean-card p-6 rounded-2xl border border-teal-500/30 bg-gradient-to-r dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 from-teal-900 via-slate-900 to-teal-950 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 text-slate-950">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Verified Doctor Directory</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> LICENSE VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed mt-1 font-medium max-w-2xl">
              Browse board-certified doctors, verify their state medical licenses, and request online consultations. 
              Doctors cannot access your medical reports until you explicitly grant permission in your Security Center.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, specialty, or hospital..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 shadow-sm"
          />
        </div>

        {/* Specialization Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {['ALL', 'Cardiology', 'Endocrinology', 'General Medicine', 'Neurology', 'Pediatrics', 'Oncology'].map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialization(spec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedSpecialization === spec
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Loading verified medical practitioners...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-12 text-center space-y-2 clean-card rounded-2xl p-8">
          <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No verified doctors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="clean-card p-5 rounded-2xl space-y-4 flex flex-col justify-between border dark:border-slate-800 border-slate-200 hover:border-teal-500/50 transition-all shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/30 shrink-0">
                      {doctor.full_name.charAt(4) || doctor.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{doctor.full_name}</span>
                      </h3>
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 block mt-0.5">
                        {doctor.specialization}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> VERIFIED
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 font-medium">
                  {doctor.bio}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>License: <strong className="font-mono text-slate-900 dark:text-white">{doctor.medical_license_number}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doctor.hospital_affiliation}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {doctor.rating}
                    </span>
                    <span>•</span>
                    <span>{doctor.experience_years} Years Experience</span>
                  </div>
                </div>
              </div>

              {(() => {
                const activeConsult = consultations.find(c => (c.doctor_id === doctor.id || c.doctor_name === doctor.full_name) && (c.status === 'ACCEPTED' || c.status === 'PENDING'));
                if (activeConsult) {
                  const isAccepted = activeConsult.status === 'ACCEPTED';
                  return (
                    <button
                      onClick={() => onOpenConsultationRoom?.(activeConsult)}
                      className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                        isAccepted
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 animate-pulse'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/30'
                      }`}
                    >
                      <Video className="w-4 h-4 stroke-[2.5]" />
                      <span>{isAccepted ? '🟢 Call Active: Click to Join Call' : '📞 Join Telehealth Call Room'}</span>
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => handleRequestClick(doctor)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 ${
                      user
                        ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                        : 'bg-slate-900 border border-teal-500/40 text-teal-300 hover:bg-slate-800'
                    }`}
                  >
                    {user ? <MessageSquare className="w-4 h-4" /> : <LogIn className="w-4 h-4 text-teal-400" />}
                    <span>{user ? 'Request Consultation' : 'Sign In to Consult Doctor'}</span>
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Consultation Request Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg dark:bg-slate-900 bg-white rounded-2xl p-6 shadow-2xl border dark:border-slate-700/80 border-slate-200 space-y-4">
            
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold border border-teal-500/30">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Book Medical Consultation</h3>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">{selectedDoctor.full_name} • {selectedDoctor.specialization}</p>
              </div>
            </div>

            {!user ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-3 font-medium">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <LogIn className="w-4 h-4 text-amber-500" /> Authentication Required
                </p>
                <p>
                  You must sign in or register a patient account before submitting a medical consultation request to a verified doctor.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctor(null);
                    onOpenAuthModal();
                  }}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register Now</span>
                </button>
              </div>
            ) : (
              <>
                {bookingSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{bookingSuccess}</span>
                  </div>
                )}

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleBookConsultation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Describe Your Symptoms / Medical Inquiry
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={symptomsNote}
                      onChange={(e) => setSymptomsNote(e.target.value)}
                      placeholder="e.g. Seeking consultation regarding elevated fasting glucose, HbA1c 6.8%, and cholesterol test values from last month."
                      className="w-full p-3 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-900 dark:text-teal-300 space-y-1 font-medium">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-teal-500" /> Zero-Trust Patient Privacy Guarantee
                    </p>
                    <p>
                      {selectedDoctor.full_name} cannot view your saved lab reports until you approve their report permission request in your Security Center.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isBooking}
                    className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isBooking ? (
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>Submit Consultation Request</span>
                    )}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <MedicalDisclaimer />
      </div>

    </div>
  );
};
