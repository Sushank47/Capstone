import React, { useEffect, useState } from 'react';
import type { AccessRequest, AuditLog } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Clock, Eye, LogIn } from 'lucide-react';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  openAuthModal?: () => void;
}

export const ConsentManager: React.FC<Props> = ({ openAuthModal }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsentData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [reqRes, auditRes] = await Promise.allSettled([
        api.get<AccessRequest[]>('/api/consent/requests'),
        api.get<AuditLog[]>('/api/audit'),
      ]);

      if (reqRes.status === 'fulfilled' && Array.isArray(reqRes.value.data)) {
        setRequests(reqRes.value.data);
      } else {
        setRequests([]);
      }

      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value.data)) {
        setAuditLogs(auditRes.value.data);
      } else {
        setAuditLogs([]);
      }
    } catch (e) {
      console.error('Failed to load consent & audit logs', e);
      setRequests([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsentData();
  }, [user]);

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    try {
      await api.post(`/api/consent/${requestId}/action`, { action });
      fetchConsentData();
    } catch {
      alert('Failed to process consent action.');
    }
  };

  const renderDetails = (details: any, reason?: string) => {
    if (typeof details === 'string' && details.trim()) return details;
    if (details && typeof details === 'object') {
      if (details.reason) return String(details.reason);
      if (details.message) return String(details.message);
      try {
        return JSON.stringify(details);
      } catch {
        return 'Security event recorded';
      }
    }
    return reason || 'Security audit log entry recorded';
  };

  if (!user) {
    return (
      <div className="py-16 text-center space-y-4 clean-card rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero-Trust Patient Consent Center</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 font-medium">
            Please sign in to manage doctor permissions, administrative access requests, and inspect your immutable security audit logs.
          </p>
        </div>
        {openAuthModal && (
          <button
            onClick={openAuthModal}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Zero-Trust Architecture Notice Banner */}
      <div className="clean-card p-6 rounded-2xl border border-teal-500/30 bg-gradient-to-r dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900 from-teal-900 via-slate-900 to-teal-950 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 text-slate-950">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Zero-Trust Patient Consent & Encryption Architecture</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed mt-1 font-medium">
              Your medical documents are strictly isolated in your encrypted partition. Administrators, doctors, or third parties 
              <strong> cannot access, view, download, or index your medical files</strong> without your explicit, time-bounded approval. 
              Every access request requires a mandatory reason, and all access events are written to an immutable audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Access Requests Table / List */}
      <div className="clean-card p-6 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Administrative Access Requests
        </h3>

        {!requests || requests.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 font-medium">No access requests found.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{req.admin_name || req.patient_email || 'User'}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                      ADMIN
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300'
                        : req.status === 'REJECTED' || req.status === 'REVOKED'
                        ? 'bg-rose-500/20 text-rose-900 dark:text-rose-300'
                        : 'bg-amber-500/20 text-amber-900 dark:text-amber-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Reason: "{req.reason}"</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Requested on {req.created_at ? new Date(req.created_at).toLocaleString() : 'Recent'}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, 'APPROVE')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm"
                      >
                        Grant Access
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'REJECT')}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-sm"
                      >
                        Deny
                      </button>
                    </>
                  )}
                  {req.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(req.id, 'REVOKE')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
                    >
                      Revoke Access Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Immutable Audit Log History */}
      <div className="clean-card p-6 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Immutable Security Audit Logs
        </h3>

        {!auditLogs || auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 font-medium">No audit logs recorded.</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl dark:bg-slate-950/60 dark:border-slate-800 bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{log.performed_by_name || log.performed_by_id || 'System'}</span>
                    <span className="text-slate-700 dark:text-slate-300 ml-2 font-medium">[{log.action || 'SECURITY'}] - {renderDetails(log.details, log.reason)}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MEDICAL DISCLAIMER PLACED AT THE BOTTOM */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <MedicalDisclaimer />
      </div>

    </div>
  );
};
