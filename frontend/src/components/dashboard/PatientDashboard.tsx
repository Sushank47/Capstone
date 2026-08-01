import React from 'react';
import type { Document, AccessRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import {
  FileText,
  Upload,
  GitCompare,
  MessageSquare,
  ShieldCheck,
  Star,
  Activity,
  HardDrive,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Zap,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface Props {
  documents: Document[];
  requests: AccessRequest[];
  onSelectDocument: (doc: Document) => void;
  openUploadModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const PatientDashboard: React.FC<Props> = ({
  documents,
  requests,
  onSelectDocument,
  openUploadModal,
  setActiveTab
}) => {
  const { user } = useAuth();
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const starredDocs = documents.filter((d) => d.is_favorite);

  const totalStorageBytes = documents.reduce((acc, curr) => acc + curr.file_size_bytes, 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

  const sampleVitals = [
    { label: "Hemoglobin", value: "14.2 g/dL", status: "Optimal Range" },
    { label: "Fasting Glucose", value: "95 mg/dL", status: "Healthy Normal" },
    { label: "Total Cholesterol", value: "172 mg/dL", status: "Desirable" },
    { label: "Blood Pressure", value: "120/80 mmHg", status: "Optimal" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Pending Access Request Alert Banner */}
      {pendingRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-4 shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300">Administrative Document Access Request</h4>
              <p className="text-xs text-amber-800 dark:text-slate-300">An administrator has requested temporary read-only access with a stated technical reason.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('security')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow-md transition-all"
          >
            Review Request ({pendingRequests.length})
          </button>
        </div>
      )}

      {/* DISTINCT LOGGED-IN HERO COMMAND CENTER BANNER */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r dark:from-slate-900 dark:via-teal-950 dark:to-slate-900 from-teal-900 via-slate-900 to-teal-950 border border-teal-500/30 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
              <span>Logged-In Patient Intelligence Portal</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300">{user?.full_name || 'Patient'}</span> 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Your personal healthcare vault is active. Upload new blood work or prescriptions, chat with grounded AI, or analyze historical lab trends with zero-trust privacy.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[11px] font-semibold text-teal-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> MongoDB Cloud Encrypted
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Zero-Trust Consent Active
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={openUploadModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Upload New Medical Report</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Ask AI Medical Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK COMMAND CENTER CARDS */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Quick Command Actions
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div
            onClick={openUploadModal}
            className="group cursor-pointer clean-card p-5 rounded-2xl border dark:border-slate-800 border-slate-200 hover:border-teal-500/50 transition-all hover:scale-[1.02] space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">Upload Document</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Extract OCR, entities & plain-English summary</p>
            </div>
            <div className="flex items-center text-[11px] font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
              <span>Start Upload</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('chat')}
            className="group cursor-pointer clean-card p-5 rounded-2xl border dark:border-slate-800 border-slate-200 hover:border-cyan-500/50 transition-all hover:scale-[1.02] space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">AI Medical Chat</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ask questions with voice and grounded RAG citations</p>
            </div>
            <div className="flex items-center text-[11px] font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>Launch Chat</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('compare')}
            className="group cursor-pointer clean-card p-5 rounded-2xl border dark:border-slate-800 border-slate-200 hover:border-purple-500/50 transition-all hover:scale-[1.02] space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 transition-all">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">Compare Reports</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Side-by-side historical lab value progression</p>
            </div>
            <div className="flex items-center text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Compare Now</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('security')}
            className="group cursor-pointer clean-card p-5 rounded-2xl border dark:border-slate-800 border-slate-200 hover:border-amber-500/50 transition-all hover:scale-[1.02] space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">Zero-Trust Security</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage doctor access & audit logs</p>
            </div>
            <div className="flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Consent Controls</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

        </div>
      </div>

      {/* STATS & BIOMETRIC VITALS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Patient Vault Overview */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Vault Overview
          </h3>

          <div className="clean-card p-5 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Stored Documents</p>
                <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">{documents.length}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="pt-3 border-t dark:border-slate-800 border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Encrypted Cloud Storage:</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{totalStorageMB} MB</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Starred Favorites:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{starredDocs.length} Reports</span>
            </div>

            <button
              onClick={() => setActiveTab('vault')}
              className="w-full py-2 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-teal-300 bg-slate-100 hover:bg-slate-200 text-teal-700 font-semibold text-xs border dark:border-slate-700 border-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Medical Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Biometric Vitals & Recent Lab Values */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Key Biometric Vitals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sampleVitals.map((v, idx) => (
              <div key={idx} className="clean-card p-4 rounded-2xl border dark:border-slate-800 border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{v.label}</p>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{v.value}</h4>
                  <span className="inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-1 border border-emerald-500/20">
                    {v.status}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RECENT DOCUMENTS QUICK ACCESS */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Recent Medical Reports
            </h3>
            <button
              onClick={() => setActiveTab('vault')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1"
            >
              View All ({documents.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.slice(0, 3).map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="group cursor-pointer clean-card p-4 rounded-2xl border dark:border-slate-800 border-slate-200 hover:border-teal-500/50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[160px]">{doc.file_name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase">
                    {doc.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {doc.ai_summary?.overview || doc.ocr_data?.extracted_text || 'Report summary indexed.'}
                </p>

                <div className="pt-2 border-t dark:border-slate-800 border-slate-200 flex items-center justify-between text-[11px] font-semibold text-teal-600 dark:text-teal-400 group-hover:text-teal-500">
                  <span>View Full AI Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEDICAL DISCLAIMER PLACED AT THE BOTTOM */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <MedicalDisclaimer />
      </div>

    </div>
  );
};
