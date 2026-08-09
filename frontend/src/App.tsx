import React, { useState, useEffect, Component, ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { HomePageShowcase } from './components/home/HomePageShowcase';
import { PatientDashboard } from './components/dashboard/PatientDashboard';
import { DocumentList } from './components/documents/DocumentList';
import { DocumentUploadModal } from './components/documents/DocumentUploadModal';
import { DocumentDetailModal } from './components/documents/DocumentDetailModal';
import { ReportComparison } from './components/comparison/ReportComparison';
import { MedicalAIChat } from './components/chat/MedicalAIChat';
import { ConsentManager } from './components/security/ConsentManager';
import { DoctorDirectory } from './components/doctors/DoctorDirectory';
import { DoctorDashboard } from './components/doctors/DoctorDashboard';
import { DoctorPatientChat } from './components/doctors/DoctorPatientChat';
import { IncomingCallModal } from './components/common/IncomingCallModal';
import type { Document, AccessRequest, Consultation } from './types';
import { api } from './services/api';
import { Activity, Info, LogIn, CheckCircle2, Clock, MessageSquare, Video, Stethoscope, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false });
    window.location.hash = 'home';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white">MediPro AI Application Session Active</h2>
          <p className="text-xs text-slate-400 max-w-md font-medium">
            Click below to return to your Home Overview.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Return to Overview</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  // Browser History Navigation State
  const [activeTab, setActiveTabState] = useState(() => {
    return window.location.hash.replace('#', '') || 'home';
  });

  const setActiveTab = (tab: string, pushHistory = true) => {
    setActiveTabState(tab);
    if (pushHistory) {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const targetTab = e.state?.tab || window.location.hash.replace('#', '') || 'home';
      setActiveTabState(targetTab);
    };

    if (!window.history.state) {
      const initialTab = window.location.hash.replace('#', '') || 'home';
      window.history.replaceState({ tab: initialTab }, '', `#${initialTab}`);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.role === 'DOCTOR' && activeTab === 'home') {
      setActiveTab('doctor_portal', false);
    } else if (!user && activeTab !== 'home' && activeTab !== 'chat') {
      setActiveTab('home', false);
      window.location.hash = 'home';
    }
  }, [user]);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dismissedCallIds, setDismissedCallIds] = useState<string[]>([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);

  const fetchAppData = async () => {
    if (!user) return;
    try {
      if (user?.role === 'PATIENT') {
        const [docsRes, reqRes, consultRes] = await Promise.allSettled([
          api.get<Document[]>('/api/documents'),
          api.get<AccessRequest[]>('/api/consent/requests'),
          api.get<Consultation[]>('/api/doctors/consultations/my')
        ]);
        if (docsRes.status === 'fulfilled') setDocuments(docsRes.value.data);
        if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data);
        if (consultRes.status === 'fulfilled') setConsultations(consultRes.value.data);
      } else if (user?.role === 'DOCTOR') {
        const consultRes = await api.get<Consultation[]>('/api/doctors/consultations/my');
        setConsultations(consultRes.data);
      }
    } catch {
      console.error('Failed to load application data');
    }
  };

  useEffect(() => {
    fetchAppData();
  }, [user]);

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-bold text-sm">
        <Activity className="w-6 h-6 animate-spin mr-2" /> Loading MediPro AI Healthcare Platform...
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openUploadModal={() => setIsUploadModalOpen(true)}
        openAuthModal={() => setIsAuthModalOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main App Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Guest Access Indicator Header */}
        {!user && (
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between gap-4 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-teal-500" />
              <span>
                <strong>Guest Access Mode:</strong> You can test AI Chat Q&A right now without registering. 
                Sign in to save reports, consult verified doctors, and manage Zero-Trust security logs.
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        {/* Consultation Status Notification Bar for Patients & Doctors */}
        {user && consultations.length > 0 && (
          <div className="space-y-2">
            {consultations.map((consult) => {
              const rawCreated = consult.created_at ? new Date(consult.created_at).getTime() : Date.now();
              const safeCreatedTime = isNaN(rawCreated) ? Date.now() : rawCreated;
              const nowTime = Date.now();
              const elapsedSecs = Math.max(0, Math.floor((nowTime - safeCreatedTime) / 1000));
              const remainingSecs = Math.max(0, 180 - elapsedSecs);

              const mins = Math.floor(remainingSecs / 60) || 0;
              const secs = Math.floor(remainingSecs % 60) || 0;
              const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

              if (user?.role === 'PATIENT') {
                if (consult.status === 'ACCEPTED') {
                  return (
                    <div
                      key={consult.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-500/20 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                          <Phone className="w-5 h-5 animate-bounce text-slate-950" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                              📞 TELEHEALTH CALL ACTIVE: {user?.role === 'PATIENT' ? consult.doctor_name : consult.patient_name}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold animate-pulse">
                              ROOM READY
                            </span>
                          </div>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                            Status: <strong className="uppercase">ACCEPTED</strong> • Click below to join live Video/Audio call now.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveConsultation(consult)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 shrink-0"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Live Telehealth Call</span>
                      </button>
                    </div>
                  );
                } else if (consult.status === 'PENDING') {
                  return (
                    <div
                      key={consult.id}
                      className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-900 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-amber-500 shrink-0 animate-spin" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              Consultation Request Sent to {consult.doctor_name}
                            </p>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              ⏱ {formattedTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                            Status: <strong className="uppercase">PENDING ACCEPTANCE</strong> • Click button on right to join call room anytime.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveConsultation(consult)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Telehealth Call Room</span>
                      </button>
                    </div>
                  );
                }
              } else if (user?.role === 'DOCTOR') {
                if (consult.status === 'PENDING') {
                  return (
                    <div
                      key={consult.id}
                      className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-900 dark:text-teal-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <Stethoscope className="w-5 h-5 text-teal-500 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              New Patient Consultation Request: {consult.patient_name}
                            </p>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              ⏱ Expires in {formattedTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-0.5">
                            Inquiry: "{consult.symptoms_note}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            await api.post(`/api/doctors/consultations/${consult.id}/status?new_status=ACCEPTED`);
                            fetchAppData();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Request</span>
                        </button>
                        <button
                          onClick={async () => {
                            await api.post(`/api/doctors/consultations/${consult.id}/status?new_status=REJECTED`);
                            fetchAppData();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
                        >
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })}
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'home' && (
          user ? (
            user?.role === 'DOCTOR' ? (
              <DoctorDashboard onOpenConsultationRoom={(c) => setActiveConsultation(c)} />
            ) : (
              <PatientDashboard
                documents={documents}
                requests={requests}
                onSelectDocument={(doc) => setSelectedDocument(doc)}
                openUploadModal={() => setIsUploadModalOpen(true)}
                setActiveTab={(tab) => setActiveTab(tab)}
              />
            )
          ) : (
            <HomePageShowcase
              onTryGuestChat={() => setActiveTab('chat')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )
        )}

        {activeTab === 'doctor_portal' && (
          <DoctorDashboard onOpenConsultationRoom={(c) => setActiveConsultation(c)} />
        )}

        {activeTab === 'doctors' && (
          <DoctorDirectory
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onConsultationRequested={() => {
              fetchAppData();
            }}
            consultations={consultations}
            onOpenConsultationRoom={(c) => setActiveConsultation(c)}
          />
        )}

        {activeTab === 'chat' && (
          <MedicalAIChat
            openUploadModal={() => setIsUploadModalOpen(true)}
            openAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'documents' && (
          user?.role === 'PATIENT' ? (
            <DocumentList
              documents={documents}
              onSelectDocument={(doc) => setSelectedDocument(doc)}
              onRefresh={fetchAppData}
              openUploadModal={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <div className="py-12 text-center space-y-4">
              <p className="text-sm text-slate-400">Please sign in to access your private Medical Vault.</p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Sign In / Register
              </button>
            </div>
          )
        )}

        {activeTab === 'compare' && (
          user?.role === 'PATIENT' ? (
            <ReportComparison documents={documents} />
          ) : (
            <div className="py-12 text-center space-y-4">
              <p className="text-sm text-slate-400">Please sign in to compare historical medical reports.</p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Sign In / Register
              </button>
            </div>
          )
        )}

        {activeTab === 'security' && (
          <ConsentManager openAuthModal={() => setIsAuthModalOpen(true)} />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-950 py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-300">MediPro AI</span>
            <span>© 2026 Enterprise SaaS Platform</span>
          </div>

          <p className="text-[11px] text-slate-500">
            Powered by Azure OpenAI, Vision, Language, Search RAG, Speech & MongoDB
          </p>
        </div>
      </footer>

      {/* Modals & Telehealth Consultation Room */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchAppData}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <DocumentDetailModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />

      {activeConsultation && (
        <DoctorPatientChat
          consultation={activeConsultation}
          onClose={() => setActiveConsultation(null)}
        />
      )}

      {/* Incoming Call Ringing Modal Popup for Patients */}
      {user?.role === 'PATIENT' && !activeConsultation && (() => {
        const ringingCall = consultations.find(c => c.status === 'ACCEPTED' && !dismissedCallIds.includes(c.id));
        if (ringingCall) {
          return (
            <IncomingCallModal
              consultation={ringingCall}
              onAccept={() => setActiveConsultation(ringingCall)}
              onDecline={() => setDismissedCallIds(prev => [...prev, ringingCall.id])}
            />
          );
        }
        return null;
      })()}

    </div>
  );
};

export default function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
