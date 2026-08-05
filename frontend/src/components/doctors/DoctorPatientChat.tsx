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
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  X,
  User,
  Volume2,
  MonitorUp,
  Maximize2,
  Minimize2,
  Sparkles,
  CheckCircle2
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

  // Google Meet Call State & Media Devices
  const [activeCallType, setActiveCallType] = useState<'AUDIO' | 'VIDEO' | null>('VIDEO');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Streams & Video Element Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Start Media Stream (Camera & Mic)
  useEffect(() => {
    let interval: any = null;
    let currentStream: MediaStream | null = null;

    if (activeCallType) {
      setCallDurationSeconds(0);
      interval = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);

      const startMediaDevices = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: activeCallType === 'VIDEO' ? { facingMode: 'user' } : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          currentStream = stream;
          setMediaStream(stream);
          setHasCameraAccess(activeCallType === 'VIDEO');
        } catch (err) {
          console.warn('Camera video access fallback to audio:', err);
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true }
            });
            currentStream = audioStream;
            setMediaStream(audioStream);
            setHasCameraAccess(false);
          } catch (audioErr) {
            console.warn('Microphone access unavailable:', audioErr);
            setHasCameraAccess(false);
          }
        }
      };

      startMediaDevices();
    } else {
      setCallDurationSeconds(0);
      setHasCameraAccess(false);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCallType]);

  // Audio Level Meter (WebAudio API Analyser)
  useEffect(() => {
    if (!mediaStream) {
      setAudioLevel(0);
      return;
    }

    let audioCtx: AudioContext | null = null;
    let animId: number | null = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 250)));
        animId = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio analyser error:', e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) audioCtx.close();
    };
  }, [mediaStream]);

  // Handle Screen Sharing (Google Meet DisplayMedia)
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          setScreenStream(stream);
          setIsScreenSharing(true);
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            setScreenStream(null);
          };
        } else {
          alert('Screen sharing is not supported on this device/browser.');
        }
      } catch (err) {
        console.warn('Screen share cancelled:', err);
      }
    }
  };

  const toggleMute = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  const formatCallTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setActiveCallType(null);
    try {
      await api.post(`/api/doctors/consultations/${consultation.id}/status?new_status=COMPLETED`);
    } catch {}
    onClose();
  };

  const remoteName = user?.role === 'DOCTOR' ? consultation.patient_name : consultation.doctor_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Google Meet Container Layout */}
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Google Meet Top Navigation Bar */}
        <div className="px-6 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Video className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs text-white tracking-wide">MediPro Google Meet Telehealth</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  WEBRTC ENCRYPTED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Call with {remoteName} • Chief Complaint: "{consultation.symptoms_note}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-teal-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>⏱ {formatCallTime(callDurationSeconds)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Google Meet Viewport & Side Chat Container */}
        <div className="flex-1 relative flex overflow-hidden">
          
          {/* Main Stage Video Viewport */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-4">
            
            {/* Screen Sharing Stream Mode */}
            {isScreenSharing && screenStream ? (
              <div className="w-full h-full rounded-2xl bg-black border border-slate-800 overflow-hidden relative flex items-center justify-center">
                <video
                  ref={(el) => {
                    screenVideoRef.current = el;
                    if (el && screenStream && el.srcObject !== screenStream) {
                      el.srcObject = screenStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-xs font-bold text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                  <MonitorUp className="w-4 h-4 text-teal-400 animate-pulse" />
                  <span>You are presenting your screen</span>
                </div>
              </div>
            ) : activeCallType === 'VIDEO' && hasCameraAccess && !isVideoOff ? (
              /* Remote & Main Participant Video Stage */
              <div className="relative w-full h-full max-h-[70vh] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el && mediaStream && el.srcObject !== mediaStream) {
                      el.srcObject = mediaStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl"
                />

                {/* Google Meet Remote Participant Tag */}
                <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                  <span className={`w-2.5 h-2.5 rounded-full ${audioLevel > 15 ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                  <span>{remoteName}</span>
                </div>
              </div>
            ) : (
              /* Google Meet Audio / Disabled Camera Avatar Stage */
              <div className="w-full h-full max-h-[70vh] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4 relative shadow-2xl">
                <div className={`relative w-28 h-28 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center font-extrabold text-4xl border-4 border-slate-800 shadow-2xl transition-all duration-150 ${audioLevel > 15 ? 'scale-105 shadow-teal-500/40 ring-4 ring-emerald-400' : ''}`}>
                  {remoteName.charAt(4) || remoteName.charAt(0)}
                  {!isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-md">
                      <Mic className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-lg font-extrabold text-white">{remoteName}</h4>
                  <p className="text-xs text-teal-300 font-semibold flex items-center justify-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-teal-400 animate-bounce" />
                    <span>{isVideoOff ? 'Camera turned off' : 'Google Meet Telehealth Audio Active'}</span>
                  </p>
                </div>

                {/* Google Meet Active Audio Waves */}
                {!isMuted && (
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 border border-teal-500/30 text-xs font-bold text-teal-300">
                    <span>Voice Level:</span>
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-teal-400 rounded transition-all duration-75" style={{ height: `${Math.max(4, audioLevel * 0.2)}px` }} />
                      <span className="w-1 bg-teal-400 rounded transition-all duration-75" style={{ height: `${Math.max(4, audioLevel * 0.35)}px` }} />
                      <span className="w-1 bg-teal-400 rounded transition-all duration-75" style={{ height: `${Math.max(4, audioLevel * 0.25)}px` }} />
                      <span className="w-1 bg-teal-400 rounded transition-all duration-75" style={{ height: `${Math.max(4, audioLevel * 0.4)}px` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Google Meet Floating Picture-in-Picture Self View Preview */}
            {activeCallType === 'VIDEO' && hasCameraAccess && !isVideoOff && (
              <div className="absolute bottom-6 right-6 w-44 h-28 rounded-2xl bg-slate-900 border-2 border-teal-500/60 shadow-2xl overflow-hidden z-20">
                <video
                  ref={(el) => {
                    if (el && mediaStream && el.srcObject !== mediaStream) {
                      el.srcObject = mediaStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded">
                  You (Self View)
                </div>
              </div>
            )}
          </div>

          {/* Google Meet Side Chat Panel Drawer */}
          {showInCallChat && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col p-4 z-20 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">In-Call Consultation Chat</h4>
                <button onClick={() => setShowInCallChat(false)} className="text-slate-400 hover:text-white">
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
                  placeholder="Send message to everyone..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <button type="submit" disabled={isSending} className="p-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Google Meet Bottom Floating Action Control Bar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between z-20 shrink-0">
          
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Consultation Call ID: <strong className="font-mono text-teal-400">{consultation.id.substring(0, 8)}</strong>
          </div>

          {/* Google Meet Central Action Controls */}
          <div className="flex items-center gap-3 mx-auto">
            {/* Microphone Toggle */}
            <button
              onClick={toggleMute}
              className={`p-3.5 rounded-full transition-all shadow-lg ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            {activeCallType === 'VIDEO' && (
              <button
                onClick={toggleVideo}
                className={`p-3.5 rounded-full transition-all shadow-lg ${
                  isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                }`}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            {/* Screen Share (Google Meet Present Screen) */}
            <button
              onClick={handleToggleScreenShare}
              className={`p-3.5 rounded-full transition-all shadow-lg ${
                isScreenSharing ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
              title={isScreenSharing ? "Stop Presenting Screen" : "Present Screen"}
            >
              <MonitorUp className="w-5 h-5" />
            </button>

            {/* Side Chat Drawer Toggle */}
            <button
              onClick={() => setShowInCallChat(!showInCallChat)}
              className={`p-3.5 rounded-full transition-all shadow-lg ${
                showInCallChat ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
              title="Toggle In-Call Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-rose-600/40 transition-all ml-2"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="hidden sm:inline">Leave Call</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-teal-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>

        </div>

      </div>
    </div>
  );
};
