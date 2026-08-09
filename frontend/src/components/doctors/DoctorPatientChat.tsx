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
  MessageSquare,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
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
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Media Stream & Video Element Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const peerRef = useRef<any>(null);

  const remoteName = user?.role === 'DOCTOR' ? consultation.patient_name : consultation.doctor_name;
  const myName = user?.full_name || (user?.role === 'DOCTOR' ? consultation.doctor_name : consultation.patient_name);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Native PeerJS WebRTC Direct Stream (0 Moderator Prompts, 0 Popups)
  useEffect(() => {
    let localMediaStream: MediaStream | null = null;
    let peerInstance: any = null;
    let callRetryInterval: any = null;

    const loadPeerJS = () => {
      if ((window as any).Peer) {
        initPeer();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.async = true;
      script.onload = () => initPeer();
      document.body.appendChild(script);
    };

    const initPeer = async () => {
      // 1. Get Local Camera & Microphone MediaStream
      try {
        localMediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        setLocalStream(localMediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localMediaStream;
          localVideoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Camera video access fallback to audio:', err);
        try {
          localMediaStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          setLocalStream(localMediaStream);
        } catch (audioErr) {
          console.warn('Microphone access denied:', audioErr);
        }
      }

      // 2. Setup PeerJS Connection with STUN servers
      const roomCleanId = consultation.id.replace(/[^a-zA-Z0-9]/g, '');
      const myRole = user?.role === 'DOCTOR' ? 'doctor' : 'patient';
      const targetRole = myRole === 'DOCTOR' ? 'patient' : 'doctor';

      const myPeerId = `medipro-${myRole}-${roomCleanId}`;
      const targetPeerId = `medipro-${targetRole}-${roomCleanId}`;

      peerInstance = new (window as any).Peer(myPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
          ]
        }
      });
      peerRef.current = peerInstance;

      // Handle Incoming Call
      peerInstance.on('call', (incomingCall: any) => {
        incomingCall.answer(localMediaStream);
        incomingCall.on('stream', (remoteMediaStream: MediaStream) => {
          setRemoteStream(remoteMediaStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteMediaStream;
            remoteVideoRef.current.play().catch(() => {});
          }
        });
      });

      // Initiate Call to Target Peer
      const makeCall = () => {
        if (!peerInstance || peerInstance.destroyed || !localMediaStream) return;
        try {
          const outgoingCall = peerInstance.call(targetPeerId, localMediaStream);
          if (outgoingCall) {
            outgoingCall.on('stream', (remoteMediaStream: MediaStream) => {
              setRemoteStream(remoteMediaStream);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteMediaStream;
                remoteVideoRef.current.play().catch(() => {});
              }
            });
          }
        } catch {}
      };

      peerInstance.on('open', () => {
        makeCall();
        callRetryInterval = setInterval(makeCall, 3000);
      });
    };

    loadPeerJS();

    return () => {
      if (callRetryInterval) clearInterval(callRetryInterval);
      if (localMediaStream) {
        localMediaStream.getTracks().forEach((track) => track.stop());
      }
      if (peerInstance) {
        try { peerInstance.destroy(); } catch {}
      }
    };
  }, [consultation.id]);

  // Audio Level Meter for Microphone
  useEffect(() => {
    if (!localStream) return;
    let audioCtx: AudioContext | null = null;
    let animId: number | null = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(localStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 260)));
        animId = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch {}

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) audioCtx.close();
    };
  }, [localStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
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
          alert('Screen sharing is not supported on this browser.');
        }
      } catch (err) {
        console.warn('Screen share cancelled:', err);
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60) || 0;
    const s = Math.floor(secs % 60) || 0;
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
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch {}
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
                <h3 className="font-bold text-xs text-white tracking-wide">MediPro Direct Telehealth Call</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  WEBRTC ENCRYPTED
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
          
          {/* Main Stage Viewport */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-4">
            
            {/* Screen Sharing Mode */}
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
                  <span>Presenting your screen</span>
                </div>
              </div>
            ) : remoteStream ? (
              /* REMOTE PARTICIPANT LIVE VIDEO STREAM */
              <div className="relative w-full h-full max-h-[72vh] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
                <video
                  ref={(el) => {
                    remoteVideoRef.current = el;
                    if (el && remoteStream && el.srcObject !== remoteStream) {
                      el.srcObject = remoteStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{remoteName} (Remote)</span>
                </div>
              </div>
            ) : (
              /* WAITING FOR REMOTE STREAM AVATAR CARD */
              <div className="w-full h-full max-h-[72vh] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4 relative shadow-2xl">
                <div className={`relative w-28 h-28 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center font-extrabold text-4xl border-4 border-slate-800 shadow-2xl transition-all duration-150 ${audioLevel > 15 ? 'scale-105 shadow-teal-500/40 ring-4 ring-emerald-400' : ''}`}>
                  {remoteName.charAt(4) || remoteName.charAt(0)}
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-xl font-extrabold text-white">{remoteName}</h4>
                  <p className="text-xs text-teal-300 font-semibold flex items-center justify-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-teal-400 animate-bounce" />
                    <span>Connecting Direct Telehealth Audio & Video...</span>
                  </p>
                </div>

                <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>{remoteName}</span>
                </div>
              </div>
            )}

            {/* FLOATING SELF-VIEW CAMERA TILE (YOUR CAMERA ONLY) */}
            {!isVideoOff && (
              <div className="absolute bottom-6 right-6 w-48 h-32 rounded-2xl bg-slate-900 border-2 border-teal-500/70 shadow-2xl overflow-hidden z-20">
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el && localStream && el.srcObject !== localStream) {
                      el.srcObject = localStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${audioLevel > 15 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  <span>You ({myName.split(' ')[0]})</span>
                </div>
              </div>
            )}

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

        {/* Action Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between z-20 shrink-0">
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Call ID: <strong className="font-mono text-teal-400">{consultation.id.substring(0, 8)}</strong>
          </div>

          {/* Central Call Toolbar */}
          <div className="flex items-center gap-3 mx-auto">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-all shadow-lg ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-all shadow-lg ${
                isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
              title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
            >
              {isVideoOff ? <VideoOff className="w-4.5 h-4.5" /> : <Video className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={handleToggleScreenShare}
              className={`p-3 rounded-full transition-all shadow-lg ${
                isScreenSharing ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
              title={isScreenSharing ? "Stop Presenting Screen" : "Present Screen"}
            >
              <MonitorUp className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={handleEndCall}
              className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-rose-600/40 transition-all ml-2"
            >
              <PhoneOff className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">End Telehealth Call</span>
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
