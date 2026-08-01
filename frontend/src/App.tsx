import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { HomePageShowcase } from './components/home/HomePageShowcase';
import { PatientDashboard } from './components/dashboard/PatientDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { DocumentList } from './components/documents/DocumentList';
import { DocumentUploadModal } from './components/documents/DocumentUploadModal';
import { DocumentDetailModal } from './components/documents/DocumentDetailModal';
import { ReportComparison } from './components/comparison/ReportComparison';
import { MedicalAIChat } from './components/chat/MedicalAIChat';
import { ConsentManager } from './components/security/ConsentManager';
import type { Document, AccessRequest } from './types';
import { api } from './services/api';
import { Activity, Info, LogIn, MessageSquare } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('home'); // Default view is informative Home page!

  const [documents, setDocuments] = useState<Document[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

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
      } else if (user.role === 'ADMIN') {
        const reqRes = await api.get<AccessRequest[]>('/api/consent/requests');
        setRequests(reqRes.data);
      }
    } catch {
      console.error('Failed to load application data.');
    }
  };

  useEffect(() => {
    fetchAppData();
  }, [user]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && activeTab === 'dashboard') {
      setActiveTab('admin');
    }
  }, [user]);

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center mx-auto animate-pulse">
            <Activity className="w-5 h-5 text-slate-950" />
          </div>
          <p className="text-xs font-semibold text-teal-400">Loading MediExplain AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openUploadModal={() => setIsUploadModalOpen(true)}
        openAuthModal={() => setIsAuthModalOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Guest Chat Info Notice when in Chat Tab */}
        {!user && activeTab === 'chat' && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Guest Chat Mode:</strong> You are using the AI Chatbot without signing in. No chat history or uploaded files are saved. <strong>Sign in</strong> to unlock persistent chat history and your private Medical Vault.
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
          <HomePageShowcase
            onTryGuestChat={() => setActiveTab('chat')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
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

        {activeTab === 'security' && <ConsentManager />}

        {activeTab === 'admin' && user?.role === 'ADMIN' && <AdminDashboard />}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-950 py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-300">MediExplain AI</span>
            <span>© 2026 Enterprise SaaS Platform</span>
          </div>

          <p className="text-[11px] text-slate-500">
            Powered by Azure OpenAI, Vision, Language, Search RAG, Speech & MongoDB
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchAppData}
      />

      <DocumentDetailModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
