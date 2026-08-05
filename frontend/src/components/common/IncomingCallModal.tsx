import React, { useEffect } from 'react';
import type { Consultation } from '../../types';
import { Phone, Video, X, ShieldCheck } from 'lucide-react';

interface Props {
  consultation: Consultation;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<Props> = ({ consultation, onAccept, onDecline }) => {
  // WebAudio API synthesis for realistic phone call ringtone
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let timer: any = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz ring tone
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      };

      playTone();
      timer = setInterval(playTone, 2500);
    } catch {
      // Audio context fallback
    }

    return () => {
      if (timer) clearInterval(timer);
      if (audioCtx) audioCtx.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 text-white text-center space-y-6 shadow-2xl shadow-emerald-500/20">
        
        {/* Ringing Animation Avatar */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-emerald-500/40 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-extrabold text-3xl shadow-xl border-4 border-slate-900">
            <Phone className="w-9 h-9 animate-bounce text-slate-950" />
          </div>
        </div>

        {/* Call Info */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Incoming Telehealth Call</span>
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight pt-1">
            {consultation.doctor_name}
          </h3>

          <p className="text-xs text-emerald-300 font-semibold">
            {consultation.doctor_specialization || 'Verified Medical Practitioner'}
          </p>

          <p className="text-xs text-slate-400 font-medium px-4">
            Doctor has accepted your consultation and is waiting in the encrypted Telehealth room.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={onDecline}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shadow-md"
          >
            <X className="w-4 h-4" />
            <span>Dismiss</span>
          </button>

          <button
            onClick={onAccept}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-2 animate-bounce"
          >
            <Video className="w-4 h-4 stroke-[3]" />
            <span>Accept & Join Call</span>
          </button>
        </div>

      </div>
    </div>
  );
};
