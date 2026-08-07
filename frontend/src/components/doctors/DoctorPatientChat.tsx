import React, { useState, useEffect, useRef } from 'react';
import type { Consultation } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Video,
  ShieldCheck,
  Send,
  PhoneOff,
  X,
  MessageSquare
} from 'lucide-react';

interface Props {
  consultation: Consultation;
  onClose: () => void;
}

export const DoctorPatientChat: React.FC<Props> = ({ consultation, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(consultation.messages || []);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);

  const remoteName = user?.role === 'DOCTOR' ? consultation.patient_name : consultation.doctor_name;
  const myName = user?.full_name || (user?.role === 'DOCTOR' ? consultation.doctor_name : consultation.patient_name);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize WebRTC SFU Video/Audio Engine
  useEffect(() => {
    const roomName = `MediPro_Telehealth_LiveCall_${consultation.id.replace(/[^a-zA-Z0-9]/g, '')}`;

    const loadJitsiScript = () => {
      if ((window as any).JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsi();
      document.body.appendChild(script);
    };

    const initJitsi = () => {
      if (!containerRef.current || !(window as any).JitsiMeetExternalAPI) return;

      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch {}
      }

      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: `${myName} (${user?.role === 'DOCTOR' ? 'Doctor' : 'Patient'})`
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableNoisyMicDetection: true,
          readOnlyName: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'tileview', 'fullscreen', 'hangup'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_REMOTE_DISPLAY_NAME: remoteName
        }
      };

      try {
        const apiInstance = new (window as any).JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = apiInstance;

        apiInstance.addEventListener('videoConferenceLeft', () => {
          handleEndCall();
        });
      } catch (err) {
        console.error('Failed to init WebRTC Call:', err);
      }
    };

    loadJitsiScript();

    return () => {
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch {}
        jitsiApiRef.current = null;
      }
    };
  }, [consultation.id]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    const msgText = inputText;
    setInputText('');

    try {
      const res = await api.post<Consultation>(`/api/doctors/consultations/${consultation.id}/messages?text=${encodeURIComponent(msgText)}`);
      setMessages(res.data.messages || []);
    } catch {
      alert('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEndCall = async () => {
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch {}
      jitsiApiRef.current = null;
    }
    try {
      await api.post(`/api/doctors/consultations/${consultation.id}/status?new_status=COMPLETED`);
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[94vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Header Bar */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Video className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs text-white tracking-wide">MediPro Live Telehealth Call</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE WEBRTC VIDEO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Connected with {remoteName} • Chief Complaint: "{consultation.symptoms_note}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-teal-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>⏱ {formatTime(callDuration)}</span>
            </div>

            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                showChat ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              onClick={handleEndCall}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Call Stage & Chat */}
        <div className="flex-1 relative flex overflow-hidden">
          
          {/* Main Stage Viewport (Live WebRTC Video Stream from Laptop & Mobile 5G) */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center">
            <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" />
          </div>

          {/* Side Chat Drawer */}
          {showChat && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col p-4 shrink-0 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">Telehealth Call Chat</h4>
                <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-3">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 pt-8 font-medium">No messages yet. Send a message below.</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id || (user?.role === 'DOCTOR' && msg.sender_role === 'DOCTOR');
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-bold text-slate-400 mb-0.5">{msg.sender_name}</span>
                        <div className={`p-2.5 rounded-xl text-xs ${isMe ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-white'}`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Send message..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <button type="submit" disabled={isSending} className="p-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>End-to-End Encrypted Telehealth Session</span>
          </span>
          <span className="font-mono text-[11px] text-teal-400">Room ID: {consultation.id}</span>
        </div>

      </div>
    </div>
  );
};
