import React, { useEffect, useState } from 'react';
import type { AccessRequest, AuditLog } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, CheckCircle2, XCircle, Clock, AlertTriangle, Key, Eye } from 'lucide-react';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

export const ConsentManager: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsentData = async () => {
    try {
      const [reqRes, auditRes] = await Promise.all([
        api.get<AccessRequest[]>('/api/consent/requests'),
        api.get<AuditLog[]>('/api/audit'),
      ]);
      setRequests(reqRes.data);
      setAuditLogs(auditRes.data);
    } catch {
      console.error('Failed to load consent & audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsentData();
  }, []);

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    try {
      await api.post(`/api/consent/${requestId}/action`, { action });
      fetchConsentData();
    } catch {
      alert('Failed to process consent action.');
    }
  };

  return (
    <div className="space-y-8">
      
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
            <p className="text-xs text-slate-200 leading-relaxed mt-1">
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

        {requests.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4">No access requests found.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{req.requester_name}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      {req.requester_role}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : req.status === 'REJECTED' || req.status === 'REVOKED'
                        ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Reason: "{req.reason}"</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Requested on {new Date(req.created_at).toLocaleString()}
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

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4">No audit logs recorded.</p>
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
                    <span className="font-bold text-slate-900 dark:text-white">{log.actor_email}</span>
                    <span className="text-slate-600 dark:text-slate-300 ml-2 font-medium">[{log.action_type}] - {log.details}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  {new Date(log.timestamp).toLocaleTimeString()}
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
