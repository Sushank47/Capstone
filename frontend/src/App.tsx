import React, { useState, useEffect } from 'react';
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
import type { Document, AccessRequest, Consultation } from './types';
import { api } from './services/api';
import { Activity, Info, LogIn } from 'lucide-react';

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
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);

  const fetchAppData = async () => {
    if (!user) return;
    try {
      if (user.role === 'PATIENT') {
        const [docsRes, reqRes] = await Promise.all([
          api.get<Document[]>('/api/documents'),
          api.get<AccessRequest[]>('/api/consent/requests'),
        ]);
        setDocuments(docsRes.data);
        setRequests(reqRes.data);
      }
    } catch {
      console.error('Failed to load application documents or consent requests.');
    }
  };

  useEffect(() => {
    fetchAppData();
  }, [user]);

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-bold text-sm">
        <Activity className="w-6 h-6 animate-spin mr-2" /> Loading Healthcare Intelligence Platform...
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Guest Access Indicator Header */}
        {!user && (
          <div className="mb-6 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between gap-4 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-teal-500" />
              <span>
                <strong>Guest Access Mode:</strong> You can test AI Chat Q&A and browse Verified Doctors right now without registering. 
                Sign in to save reports, consult doctors, and enable Zero-Trust security logs.
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

        {/* Tab Views */}
        {activeTab === 'home' && (
          user ? (
            user.role === 'DOCTOR' ? (
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
              alert('Consultation request submitted! The doctor will be notified to accept your request.');
            }}
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

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
