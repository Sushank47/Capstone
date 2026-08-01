import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>Educational purpose only. Consult your doctor for medical decisions.</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3 shadow-lg">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-amber-300 flex items-center gap-2 mb-1">
          <span>Important Medical Disclaimer</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            Educational & Diagnostic Safety Notice
          </span>
        </h4>
        <p className="text-xs text-amber-200/90 leading-relaxed">
          MediExplain AI utilizes Azure AI models to simplify complex medical terminology and organize reports. 
          <strong> It does not diagnose diseases, prescribe medications, or replace professional medical advice.</strong> Always consult a qualified physician or healthcare provider for official diagnosis, lab result evaluation, and treatment decisions.
        </p>
      </div>
    </div>
  );
};
