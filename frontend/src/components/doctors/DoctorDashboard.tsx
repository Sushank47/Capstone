import React, { useEffect, useState } from 'react';
import type { Consultation, Document } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Award, CheckCircle2, Clock, MessageSquare, ShieldCheck, FileText, Lock, AlertCircle, Eye, X, Send } from 'lucide-react';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  onOpenConsultationRoom: (consultation: Consultation) => void;
}

export const DoctorDashboard: React.FC<Props> = ({ onOpenConsultationRoom }) => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  // Permission Request Modal
  const [selectedConsultationForAccess, setSelectedConsultationForAccess] = useState<Consultation | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessSuccess, setAccessSuccess] = useState('');
  const [accessError, setAccessError] = useState('');

  // Approved Documents State
  const [authorizedDocuments, setAuthorizedDocuments] = useState<Document[]>([]);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const fetchDoctorData = async () => {
    try {
      const [consultRes, docRes] = await Promise.allSettled([
        api.get<Consultation[]>('/api/doctors/consultations/my'),
        api.get<Document[]>('/api/documents')
      ]);

      if (consultRes.status === 'fulfilled' && Array.isArray(consultRes.value.data)) {
        setConsultations(consultRes.value.data);
      }
      if (docRes.status === 'fulfilled' && Array.isArray(docRes.value.data)) {
        setAuthorizedDocuments(docRes.value.data);
      }
    } catch {
      console.error('Failed to load doctor dashboard consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    const interval = setInterval(() => {
      fetchDoctorData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (consultationId: string, newStatus: 'ACCEPTED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await api.post(`/api/doctors/consultations/${consultationId}/status?new_status=${newStatus}`);
      fetchDoctorData();
    } catch {
      alert('Failed to update consultation status.');
    }
  };

  const handleSendReportAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultationForAccess) return;

    setRequestingAccess(true);
    setAccessError('');
    setAccessSuccess('');

    try {
      await api.post('/api/doctors/request-report-access', {
        consultation_id: selectedConsultationForAccess.id,
        patient_id: selectedConsultationForAccess.patient_id,
        reason: accessReason
      });

      setAccessSuccess(`Report access request sent to ${selectedConsultationForAccess.patient_name}! The patient will be notified to grant permission.`);
      setTimeout(() => {
        setSelectedConsultationForAccess(null);
        setAccessReason('');
        setAccessSuccess('');
      }, 2000);
    } catch (err: any) {
      setAccessError(err.response?.data?.detail || 'Failed to submit report access request.');
    } finally {
      setRequestingAccess(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Doctor Verification Header */}
      <div className="clean-card p-6 rounded-2xl border border-teal-500/30 bg-gradient-to-r dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 from-teal-900 via-slate-900 to-teal-950 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 text-slate-950 font-bold text-xl">
              {user?.full_name?.charAt(4) || 'D'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{user?.full_name || 'Dr. Marcus Vance, MD'}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> VERIFIED MEDICAL PRACTITIONER
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium flex items-center gap-3">
                <span className="flex items-center gap-1 text-teal-300">
                  <Award className="w-3.5 h-3.5" /> Medical License: MD-88492-CAR
                </span>
                <span>•</span>
                <span>St. Jude Heart & Health Institute</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-teal-300 font-mono">
              Active Consultations: <strong>{consultations.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Consultations Queue */}
      <div className="clean-card p-6 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Patient Consultations Queue
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-Time Telehealth Requests</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 py-4 animate-pulse">Loading patient consultation requests...</p>
        ) : consultations.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No patient consultations currently active.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consult) => (
              <div
                key={consult.id}
                className="p-4 rounded-xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{consult.patient_name}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      consult.status === 'ACCEPTED'
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : consult.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {consult.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Symptoms / Inquiry: "{consult.symptoms_note}"
                  </p>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>Requested: {new Date(consult.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-teal-600 dark:text-teal-400 font-semibold">Zero-Trust Protected</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                  {consult.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(consult.id, 'ACCEPTED')}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition-all"
                      >
                        Accept Consultation
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(consult.id, 'REJECTED')}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {consult.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(consult.id, 'COMPLETED')}
                      className="px-3.5 py-1.5 rounded-lg dark:bg-slate-900 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold shadow-sm transition-all"
                    >
                      Complete & Close Call
                    </button>
                  )}

                  <button
                    onClick={() => onOpenConsultationRoom(consult)}
                    className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enter Telehealth Room</span>
                  </button>

                  <button
                    onClick={() => setSelectedConsultationForAccess(consult)}
                    className="px-3 py-1.5 rounded-lg dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-cyan-300 dark:border-cyan-500/40 bg-white hover:bg-slate-100 text-cyan-800 border border-cyan-300 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Request Medical Reports</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authorized Patient Reports Section */}
      <div className="clean-card p-6 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Authorized Patient Medical Documents
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Only medical reports explicitly approved by patients are accessible below.
        </p>

        {authorizedDocuments.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 font-medium">No patient medical reports authorized for viewing yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {authorizedDocuments.map((doc) => (
              <div key={doc.id} className="p-3.5 rounded-xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{doc.file_name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{doc.category} • {(doc.file_size_bytes / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => setViewingDocument(doc)}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm"
                >
                  Inspect Analysis
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Patient Record Access Modal */}
      {selectedConsultationForAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg dark:bg-slate-900 bg-white rounded-2xl p-6 shadow-2xl border dark:border-slate-700/80 border-slate-200 space-y-4">
            
            <button
              onClick={() => setSelectedConsultationForAccess(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold border border-teal-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Request Patient Report Access</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target Patient: {selectedConsultationForAccess.patient_name}</p>
              </div>
            </div>

            {accessSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                {accessSuccess}
              </div>
            )}

            {accessError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
                {accessError}
              </div>
            )}

            <form onSubmit={handleSendReportAccessRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Clinical Justification / Reason for Viewing Records
                </label>
                <textarea
                  required
                  rows={3}
                  value={accessReason}
                  onChange={(e) => setAccessReason(e.target.value)}
                  placeholder="e.g. Requires evaluation of baseline lipid panel and fasting glucose lab values to assess cardiovascular risk profile."
                  className="w-full p-3 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                The patient will receive an instant notification in their Security Center to grant or deny this time-bounded permission.
              </p>

              <button
                type="submit"
                disabled={requestingAccess}
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {requestingAccess ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Send Permission Request</span>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Document Detail Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl dark:bg-slate-900 bg-white rounded-2xl p-6 shadow-2xl border dark:border-slate-700 border-slate-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 border-slate-200">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{viewingDocument.file_name}</h3>
              <button onClick={() => setViewingDocument(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">AI Report Overview</h4>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{viewingDocument.ai_summary?.overview}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Medical Disclaimer */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <MedicalDisclaimer />
      </div>

    </div>
  );
};
