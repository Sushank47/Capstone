import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Lock,
  Eye,
  Stethoscope,
  Bot,
  Search,
  Volume2,
  ShieldCheck,
  UserCheck,
  HelpCircle,
  TrendingUp,
  FileCheck,
  HeartPulse,
  FolderLock
} from 'lucide-react';

interface Props {
  onTryGuestChat: () => void;
  onOpenAuthModal: () => void;
}

export const HomePageShowcase: React.FC<Props> = ({ onTryGuestChat, onOpenAuthModal }) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      
      {/* HERO SECTION */}
      <section className="text-center py-10 space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-teal-500" />
          <span>Azure AI Cloud Suite • Zero-Trust Patient Security</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight dark:text-white text-slate-900">
          Transform Complex Medical Reports Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">Simple, Patient-Friendly Intelligence</span>
        </h1>

        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed dark:text-slate-300 text-slate-600 font-medium">
          Upload blood tests, prescriptions, X-rays, and discharge summaries. Get instant plain-English breakdowns, grounded RAG Q&A, voice explanations, and side-by-side report progression with absolute privacy.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onTryGuestChat}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Try AI Chat Now (No Login Required)</span>
          </button>

          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white dark:border-slate-700 bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-teal-500" />
            <span>Sign In / Patient Vault Demo</span>
          </button>
        </div>
      </section>

      {/* WHY USE MEDIEXPLAIN AI & ADVANTAGES SECTION */}
      <section className="clean-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Simple Overview</span>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">Why Use MediExplain AI?</h2>
          <p className="text-xs dark:text-slate-300 text-slate-600 font-medium">
            Medical lab reports are full of complex medical jargon (like Hemoglobin, WBC, HbA1c, SGPT, Lipid profiles). MediExplain AI translates these documents into simple English so you can understand your health instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Key Advantages */}
          <div className="p-5 rounded-2xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Key Advantages</h3>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 font-bold">✓</span>
                <span><strong>Instant Understanding:</strong> Know what your blood test values mean without waiting for doctor appointments.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 font-bold">✓</span>
                <span><strong>Out-of-Range Highlights:</strong> Automatically flags abnormal test parameters with plain explanations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 font-bold">✓</span>
                <span><strong>Natural Voice Audio:</strong> Listen to report summaries spoken in a smooth female Siri-style voice.</span>
              </li>
            </ul>
          </div>

          {/* Card 2: What You Can Do */}
          <div className="p-5 rounded-2xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">How You Benefit</h3>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">✓</span>
                <span><strong>Doctor Visit Preparation:</strong> Receive smart, tailored questions to ask your physician.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">✓</span>
                <span><strong>Zero-Trust Privacy:</strong> Your data is isolated in your encrypted partition on Azure Cloud.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">✓</span>
                <span><strong>Zero Hallucination:</strong> Chatbot answers cite exact pages from your uploaded lab files.</span>
              </li>
            </ul>
          </div>

          {/* Card 3: What Unlocks After Login */}
          <div className="p-5 rounded-2xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FolderLock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">What Unlocks After Login?</h3>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">🔑</span>
                <span><strong>Encrypted Medical Vault:</strong> Store and organize all your medical reports permanently.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">📈</span>
                <span><strong>Side-by-Side Progression:</strong> Compare historical reports to track improvements over time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">🛡️</span>
                <span><strong>Consent Manager:</strong> Control doctor access permissions with real-time security audit logs.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* GUEST VS ACCOUNT MODE COMPARISON CARD */}
      <section className="clean-card p-6 border dark:border-teal-500/30 border-teal-500/20 dark:bg-gradient-to-r dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 bg-white shadow-sm">
        <h3 className="text-base font-bold dark:text-white text-slate-900 mb-4 text-center">Choose Your Access Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Guest Mode */}
          <div className="p-4 rounded-xl space-y-3 dark:bg-slate-950/80 dark:border-slate-800 bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Guest AI Chat Mode
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                NO LOGIN NEEDED
              </span>
            </div>
            <ul className="text-xs dark:text-slate-300 text-slate-700 space-y-2 font-medium">
              <li className="flex items-center gap-2">✓ Ask general medical & lab report questions instantly</li>
              <li className="flex items-center gap-2">✓ Powered by Azure OpenAI GPT-4 clinical guidance</li>
              <li className="flex items-center gap-2 dark:text-slate-400 text-slate-500">🔒 <strong>No chat history stored</strong> in database or memory</li>
              <li className="flex items-center gap-2 dark:text-slate-400 text-slate-500">🔒 <strong>No files saved</strong> to cloud or storage</li>
            </ul>
            <button
              onClick={onTryGuestChat}
              className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors"
            >
              Launch Guest Chat →
            </button>
          </div>

          {/* Account Mode */}
          <div className="p-4 rounded-xl space-y-3 dark:bg-slate-950/80 dark:border-slate-800 bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Authenticated Account Mode
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30">
                FULL FEATURES
              </span>
            </div>
            <ul className="text-xs dark:text-slate-300 text-slate-700 space-y-2 font-medium">
              <li className="flex items-center gap-2">✓ Private encrypted Medical Document Vault</li>
              <li className="flex items-center gap-2">✓ Persistent chat history linked to your account</li>
              <li className="flex items-center gap-2">✓ Side-by-side historical report comparison tool</li>
              <li className="flex items-center gap-2">✓ Zero-Trust patient consent manager & security logs</li>
            </ul>
            <button
              onClick={onOpenAuthModal}
              className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Sign In to Account →
            </button>
          </div>

        </div>
      </section>

      {/* AZURE AI CAPABILITIES GRID */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">Enterprise Azure AI Engine</h2>
          <p className="text-xs dark:text-slate-400 text-slate-600 max-w-xl mx-auto font-medium">
            MediExplain AI integrates six dedicated Azure Cloud AI services for clinical accuracy and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="clean-card p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold dark:text-white text-slate-900">Azure AI Vision (OCR)</h4>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Scans multi-page PDFs, radiology sheets, handwritten doctor notes, and lab tables with high precision.
            </p>
          </div>

          <div className="clean-card p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold dark:text-white text-slate-900">Azure AI Language (Health NLP)</h4>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Categorizes clinical medical entities, dosages, lab parameters, reference ranges, and diagnostic status.
            </p>
          </div>

          <div className="clean-card p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold dark:text-white text-slate-900">Azure OpenAI (GPT-4)</h4>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Generates empathetic plain-English report overviews, out-of-range parameter guides, and doctor questions.
            </p>
          </div>

          <div className="clean-card p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold dark:text-white text-slate-900">Azure AI Search (Vector RAG)</h4>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Indexes document chunks to ensure chatbot responses cite source document references with zero hallucination.
            </p>
          </div>

          <div className="clean-card p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold dark:text-white text-slate-900">Azure AI Speech (TTS)</h4>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Converts complex document breakdowns into natural neural voice output for easy listening.
            </p>
          </div>

          <div className="clean-card p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold dark:text-white text-slate-900">Zero-Trust Patient Consent</h4>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Administrators cannot open or view patient files without explicit, time-limited patient approval.
            </p>
          </div>

        </div>
      </section>

      {/* STEP BY STEP PROCESS */}
      <section className="clean-card p-6 space-y-6">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 text-center tracking-tight">How MediExplain AI Works in 3 Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-sm flex items-center justify-center mx-auto border border-teal-500/30">
              1
            </div>
            <h4 className="text-xs font-bold dark:text-white text-slate-900">Upload or Chat</h4>
            <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Upload report PDFs or scans into your private vault, or use Guest Chat instantly.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-extrabold text-sm flex items-center justify-center mx-auto border border-cyan-500/30">
              2
            </div>
            <h4 className="text-xs font-bold dark:text-white text-slate-900">Automated Azure Processing</h4>
            <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Azure AI Vision OCR extracts text, NLP identifies terms, and GPT-4 builds summaries.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center mx-auto border border-emerald-500/30">
              3
            </div>
            <h4 className="text-xs font-bold dark:text-white text-slate-900">Understand & Take Action</h4>
            <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed font-medium">
              Read simplified explanations, listen to voice summary audio, and get doctor questions.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
