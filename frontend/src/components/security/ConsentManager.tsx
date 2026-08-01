import React, { useEffect, useState } from 'react';
import type { AccessRequest, AuditLog, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, XCircle, Clock, AlertTriangle, Key, Eye } from 'lucide-react';

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
      <div className="glass-panel p-6 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-900 via-teal-950/20 to-slate-900">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
            <Lock className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Zero-Trust Patient Consent & Encryption Architecture</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Your medical documents are strictly isolated in your encrypted partition. Administrators, doctors, or third parties 
              <strong> cannot access, view, download, or index your medical files</strong> without your explicit, time-bounded approval. 
              Every access request requires a mandatory reason, and all access events are written to an immutable audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Access Requests Manager */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-400" />
            <span>Administrative Access Requests ({requests.length})</span>
          </h4>
          <span className="text-xs text-slate-400">Patient Consent Control Center</span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">No Active Access Requests</p>
            <p className="text-[11px] text-slate-400 mt-1">No platform administrator has requested permission to view your documents.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl glass-card border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{req.admin_name}</span>
                    <span className="text-[10px] text-slate-400">({req.admin_email})</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : req.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-2">
                    <strong className="text-teal-400">Stated Reason:</strong> {req.reason}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                    <span>Requested: {new Date(req.created_at).toLocaleString()}</span>
                    {req.expires_at && (
                      <span className="text-amber-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> Expires: {new Date(req.expires_at).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>

                {/* Patient Action Buttons */}
                {user?.role === 'PATIENT' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAction(req.id, 'APPROVE')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                        >
                          Approve (24h Access)
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'REJECT')}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/40 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {req.status === 'APPROVED' && (
                      <button
                        onClick={() => handleAction(req.id, 'REVOKE')}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        Revoke Access Immediately
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Immutable Security Audit Trail */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Immutable Security Audit Log Trail ({auditLogs.length})</span>
          </h4>
          <span className="text-xs text-slate-400">Cryptographically Recorded Activity</span>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Action</th>
                <th className="p-4">Performed By</th>
                <th className="p-4">Reason / Event Details</th>
                <th className="p-4">IP Address</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action.includes('UNAUTHORIZED') || log.action.includes('REVOKED')
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : log.action.includes('APPROVED') || log.action.includes('UPLOAD')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-white">
                    {log.performed_by_name} <span className="text-[10px] text-slate-400">({log.performed_by_role})</span>
                  </td>
                  <td className="p-4 text-slate-300 max-w-xs truncate">
                    {log.reason || log.document_name || 'Standard audit event'}
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">{log.ip_address}</td>
                  <td className="p-4 text-right text-slate-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
