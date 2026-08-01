import React from 'react';
import type { Document, AccessRequest } from '../../types';
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
  ArrowRight
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
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const starredDocs = documents.filter((d) => d.is_favorite);

  const totalStorageBytes = documents.reduce((acc, curr) => acc + curr.file_size_bytes, 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Medical Safety Disclaimer */}
      <MedicalDisclaimer />

      {/* Pending Access Request Alert Banner */}
      {pendingRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-amber-300">Administrative Document Access Request</h4>
              <p className="text-xs text-slate-300">An administrator has requested temporary read-only access with a stated technical reason.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('security')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow-md"
          >
            Review Request ({pendingRequests.length})
          </button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Medical Vault</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{documents.length}</h3>
            <p className="text-[10px] text-teal-400 font-medium mt-1">Indexed Reports</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Encrypted Storage</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{totalStorageMB} MB</h3>
            <p className="text-[10px] text-cyan-400 font-medium mt-1">Azure Blob Partition</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Starred Reports</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{starredDocs.length}</h3>
            <p className="text-[10px] text-amber-400 font-medium mt-1">Quick Favorites</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Star className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Zero-Trust Consent</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{pendingRequests.length}</h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-1">Pending Requests</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Quick Action Feature Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-teal-500/30 bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
            Azure AI RAG Grounded Intelligence
          </span>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Ask MediExplain AI About Your Medical Documents
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Get instant plain-English answers to questions like "Explain my blood report", "What does low hemoglobin mean?", or "Summarize all my lab results" using your private indexed reports.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Launch AI RAG Assistant</span>
          </button>

          <button
            onClick={openUploadModal}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Reports Timeline */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Recent Medical Report Timeline ({documents.slice(0, 5).length})</span>
            </h4>
            <button
              onClick={() => setActiveTab('documents')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">No Medical Files Uploaded Yet</p>
              <p className="text-[10px] text-slate-400 mt-1">Upload a blood report, prescription, or lab result to begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="p-3.5 rounded-xl glass-card border border-slate-800 hover:border-teal-500/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white hover:text-teal-300 transition-colors line-clamp-1">
                        {doc.file_name}
                      </h5>
                      <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-teal-400">{doc.category}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-teal-400 hover:underline shrink-0">
                    View Breakdown →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tools Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Platform Shortcuts</span>
          </h4>

          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('compare')}
              className="w-full p-4 rounded-xl glass-card border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <GitCompare className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
              </div>
              <h5 className="text-xs font-bold text-white mt-2">Compare Historical Reports</h5>
              <p className="text-[11px] text-slate-400 mt-1">Compare lab values across different dates with AI diff analysis.</p>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className="w-full p-4 rounded-xl glass-card border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" />
              </div>
              <h5 className="text-xs font-bold text-white mt-2">Consent & Audit Logs</h5>
              <p className="text-[11px] text-slate-400 mt-1">Review admin access requests and view your immutable access history.</p>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
