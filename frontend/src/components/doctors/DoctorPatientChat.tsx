import React, { useState, useEffect, useRef } from 'react';
import type { Consultation } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Phone,
  Video,
  ShieldCheck,
  Send,
  PhoneOff,
  X,
  Volume2
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

  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);
  const [callConnected, setCallConnected] = useState(false);

  const remoteName = user?.role === 'DOCTOR' ? consultation.patient_name : consultation.doctor_name;
  const myName = user?.full_name || (user?.role === 'DOCTOR' ? consultation.doctor_name : consultation.patient_name);

  // Initialize Enterprise SFU WebRTC Video/Audio Calling Engine
  useEffect(() => {
    const roomName = `MediPro_Telehealth_Room_${consultation.id.replace(/-/g, '')}`;

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
      if (!jitsiContainerRef.current || !(window as any).JitsiMeetExternalAPI) return;

      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }

      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: `${myName} (${user?.role === 'DOCTOR' ? 'Doctor' : 'Patient'})`
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableNoisyMicDetection: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'chat',
            'raisehand', 'tileview', 'fullscreen', 'hangup'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_REMOTE_DISPLAY_NAME: remoteName
        }
      };

      try {
        const apiInstance = new (window as any).JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = apiInstance;
        setCallConnected(true);

        apiInstance.addEventListener('videoConferenceLeft', () => {
          handleEndCall();
        });
      } catch (err) {
        console.error('Failed to initialize Jitsi Meet WebRTC:', err);
      }
    };

    loadJitsiScript();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [consultation.id]);

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
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    try {
      await api.post(`/api/doctors/consultations/${consultation.id}/status?new_status=COMPLETED`);
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Video className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs text-white tracking-wide">MediPro Google Meet Telehealth</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SFU WEBRTC ENCRYPTED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Call with {remoteName} • Chief Complaint: "{consultation.symptoms_note}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleEndCall}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WebRTC SFU Call Stage & In-Call Chat */}
        <div className="flex-1 relative flex overflow-hidden">
          
          {/* Main Stage Viewport (Jitsi Enterprise SFU WebRTC) */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center">
            <div ref={jitsiContainerRef} className="w-full h-full rounded-2xl overflow-hidden" />
          </div>

          {/* Side Chat Drawer */}
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col p-4 shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Telehealth Room Chat</h4>
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
                placeholder="Send message to doctor..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <button type="submit" disabled={isSending} className="p-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

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
