import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Home,
  MessageSquare,
  FileText,
  GitCompare,
  ShieldCheck,
  Upload,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Activity,
  Stethoscope
} from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openUploadModal: () => void;
  openAuthModal: () => void;
  pendingRequestsCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  openUploadModal,
  openAuthModal,
  pendingRequestsCount
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const guestTabs = [
    { id: 'home', label: 'Home Overview', icon: Home },
    { id: 'chat', label: 'Try AI Chat', icon: MessageSquare },
  ];

  const patientTabs = [
    { id: 'home', label: 'Home Overview', icon: Home },
    { id: 'chat', label: 'Try AI Chat', icon: MessageSquare },
    { id: 'documents', label: 'Medical Vault', icon: FileText },
    { id: 'compare', label: 'Compare Reports', icon: GitCompare },
    { id: 'security', label: 'Security & Consent', icon: ShieldCheck, badge: pendingRequestsCount },
  ];

  const currentTabs = !user ? guestTabs : patientTabs;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-md shadow-teal-500/20">
            <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight dark:text-white text-slate-900">
              MediPro AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Healthcare Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 p-1 rounded-xl border transition-colors dark:bg-slate-900/80 dark:border-slate-800 bg-slate-100 border-slate-200">
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-sm font-bold'
                    : 'dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Upload Report Button */}
              {user.role === 'PATIENT' && (
                <button
                  onClick={openUploadModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload Report</span>
                </button>
              )}

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 border-slate-200"
                >
                  <div className="w-7 h-7 rounded-md bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold dark:text-slate-200 text-slate-800 hidden sm:inline">{user.full_name.split(' ')[0]}</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-xl p-2 border z-50 dark:border-slate-800 border-slate-200">
                    <div className="px-3 py-2 border-b mb-1 dark:border-slate-800 border-slate-200">
                      <p className="text-xs font-bold dark:text-white text-slate-900">{user.full_name}</p>
                      <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate">{user.email}</p>
                      {user.role === 'DOCTOR' && (
                        <span className="mt-1 text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold inline-block">
                          VERIFIED DOCTOR ✓
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        setActiveTab('home');
                        window.location.hash = 'home';
                        window.location.reload();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
