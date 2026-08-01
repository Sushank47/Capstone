import React, { useEffect, useState } from 'react';
import type { User, PlatformMetrics, AccessRequest } from '../../types';
import { api } from '../../services/api';
import {
  Server,
  Users,
  HardDrive,
  ShieldAlert,
  Activity,
  Cpu,
  Lock,
  Plus,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState('');
  const [reason, setReason] = useState('');
  const [durationHours, setDurationHours] = useState(24);
  const [requestSuccess, setRequestSuccess] = useState('');

  const fetchAdminData = async () => {
    try {
      const [metricsRes, usersRes] = await Promise.all([
        api.get<PlatformMetrics>('/api/admin/metrics'),
        api.get<User[]>('/api/admin/users'),
      ]);
      setMetrics(metricsRes.data);
      setUsers(usersRes.data);
    } catch {
      console.error('Failed to load admin platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSendAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatientId || !reason) return;
    try {
      await api.post('/api/consent/request', {
        patient_id: targetPatientId,
        reason,
        duration_hours: durationHours,
      });
      setRequestSuccess('Access request successfully dispatched to patient for consent approval.');
      setReason('');
      setShowRequestModal(false);
      fetchAdminData();
    } catch {
      alert('Failed to send access request.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Zero-Trust Admin Security Banner */}
      <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-bold text-rose-200">Zero-Trust Administrative Policy Enforced</h4>
            <p className="text-slate-300 mt-0.5">
              Administrators are restricted to platform metadata. You cannot open, search, or download patient medical documents without explicit, time-limited patient consent approval.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 text-white font-bold text-xs shrink-0 shadow-lg flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span>Request Patient Consent</span>
        </button>
      </div>

      {requestSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
          {requestSuccess}
        </div>
      )}

      {/* Platform Stat Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Platform Users</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{metrics.total_users}</h3>
              <p className="text-[10px] text-teal-400 font-medium mt-1">{metrics.patients_count} Patients • {metrics.admins_count} Admins</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Indexed Documents</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{metrics.total_documents_indexed}</h3>
              <p className="text-[10px] text-cyan-400 font-medium mt-1">Azure Search RAG Vectors</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Server className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Storage Consumed</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{metrics.total_storage_used_mb} MB</h3>
              <p className="text-[10px] text-amber-400 font-medium mt-1">Azure Blob Storage</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Security Audits</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{metrics.total_security_audit_events}</h3>
              <p className="text-[10px] text-emerald-400 font-medium mt-1">Immutable Log Records</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

        </div>
      )}

      {/* Azure Services System Health Monitor */}
      {metrics?.azure_services_status && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>Azure Cloud AI Suite System Health Monitor</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(metrics.azure_services_status).map(([service, status], idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {service.replace(/_/g, ' ')}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  <span>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management Table (Metadata ONLY) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>User Account Management ({users.length})</span>
          </h4>
          <span className="text-[11px] text-slate-400">Metadata Access Only • No Patient File Browsing</span>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">User Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Indexed Docs</th>
                <th className="p-4">Storage Used</th>
                <th className="p-4 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-semibold text-white">{u.full_name}</td>
                  <td className="p-4 text-slate-400">{u.email}</td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      u.role === 'ADMIN'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-teal-400">{u.document_count}</td>
                  <td className="p-4 font-mono text-slate-400">{(u.storage_used_bytes / 1024 / 1024).toFixed(2)} MB</td>
                  <td className="p-4 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE & VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Consent Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-1">Submit Consent Access Request</h3>
            <p className="text-xs text-slate-400 mb-4">Patient will receive an in-app notification & audit log entry.</p>

            <form onSubmit={handleSendAccessRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Patient</label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="">Select Patient Account...</option>
                  {users.filter(u => u.role === 'PATIENT').map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Stated Reason for Access</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Technical support to verify OCR parsing issue on blood report"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Requested Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (Default)</option>
                  <option value={48}>48 Hours</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs"
                >
                  Send Access Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
