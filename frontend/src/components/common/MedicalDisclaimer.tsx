import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg dark:bg-slate-900 dark:border-amber-500/30 dark:text-amber-300 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>Educational purpose only. Consult your doctor for medical decisions.</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl dark:bg-slate-900 dark:border-amber-500/40 dark:text-amber-200 bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-sm transition-colors duration-200">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-amber-950 dark:text-amber-300 flex items-center gap-2 mb-1">
          <span>Important Medical Disclaimer</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-400/20 text-amber-950 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-400/30">
            Educational & Diagnostic Safety Notice
          </span>
        </h4>
        <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed font-medium">
          MediPro AI utilizes Azure AI models to simplify complex medical terminology and organize reports. 
          <strong className="font-extrabold text-amber-950 dark:text-white"> It does not diagnose diseases, prescribe medications, or replace professional medical advice.</strong> Always consult a qualified physician or healthcare provider for official diagnosis, lab result evaluation, and treatment decisions.
        </p>
      </div>
    </div>
  );
};
