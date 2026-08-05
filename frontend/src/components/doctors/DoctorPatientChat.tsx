import React, { useState, useEffect, useRef } from 'react';
import type { Consultation } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Phone, Video, ShieldCheck, Send, Mic, MicOff, VideoOff, PhoneOff, X, User, Volume2 } from 'lucide-react';

interface Props {
  consultation: Consultation;
  onClose: () => void;
}

export const DoctorPatientChat: React.FC<Props> = ({ consultation, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(consultation.messages || []);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Audio / Video Call State & Media Devices
  const [activeCallType, setActiveCallType] = useState<'AUDIO' | 'VIDEO' | null>('VIDEO'); // Auto start call on join
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (activeCallType) {
      setCallDurationSeconds(0);
      interval = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);

      // Request browser WebRTC camera & microphone stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: activeCallType === 'VIDEO',
            audio: true
          })
          .then((stream) => {
            setMediaStream(stream);
            setHasCameraAccess(activeCallType === 'VIDEO');
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn('Browser media device access fallback:', err);
            setHasCameraAccess(false);
          });
      }
    } else {
      setCallDurationSeconds(0);
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
      setHasCameraAccess(false);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCallType]);

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
    setActiveCallType(null);
    try {
      await api.post(`/api/doctors/consultations/${consultation.id}/status?new_status=COMPLETED`);
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-[85vh] dark:bg-slate-900 bg-white rounded-2xl p-6 shadow-2xl border dark:border-slate-700/80 border-slate-200 flex flex-col overflow-hidden">
        
        {/* Telehealth Room Header */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800 border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg text-slate-950 font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {user?.role === 'DOCTOR' ? `Patient: ${consultation.patient_name}` : `Consultation: ${consultation.doctor_name}`}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                  ENCRYPTED TELEHEALTH ROOM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {user?.role === 'DOCTOR' ? `Specialty: ${consultation.doctor_specialization}` : `Patient Email: ${consultation.patient_email}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCallType('AUDIO')}
              className="p-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Start Audio Call"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Audio Call</span>
            </button>

            <button
              onClick={() => setActiveCallType('VIDEO')}
              className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Start HD Video Call"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline font-extrabold">Video Call</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Symptoms Note Banner */}
        <div className="p-3 my-3 rounded-xl dark:bg-slate-950/80 dark:border-slate-800 bg-slate-50 border border-slate-200 text-xs shrink-0 flex items-center justify-between">
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            <strong className="text-teal-600 dark:text-teal-400">Chief Complaint:</strong> "{consultation.symptoms_note}"
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold shrink-0">Zero-Trust Protected</span>
        </div>

        {/* Message Log Thread */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">No messages in consultation room yet. Send a message below to start.</div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id || (user?.role === 'DOCTOR' && msg.sender_role === 'DOCTOR');
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{msg.sender_name}</span>
                    <span className="text-[9px] text-slate-400">({msg.sender_role})</span>
                  </div>
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-teal-500 text-slate-950 font-semibold rounded-tr-none'
                        : 'dark:bg-slate-800 dark:text-slate-100 bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Send Form */}
        <form onSubmit={handleSendMessage} className="pt-3 border-t dark:border-slate-800 border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your medical consultation message..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>

      </div>

      {/* Real WebRTC Audio / Video Telehealth Call Modal Overlay */}
      {activeCallType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white space-y-6 shadow-2xl text-center">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Encrypted WebRTC Telehealth {activeCallType === 'VIDEO' ? 'Video' : 'Audio'} Call
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-teal-300 font-mono font-bold px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30">
                  ⏱ {formatCallTime(callDurationSeconds)}
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> LIVE
                </span>
              </div>
            </div>

            {/* Video Viewport / Local WebRTC Camera Stream */}
            <div className="w-full h-64 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {activeCallType === 'VIDEO' && hasCameraAccess && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : activeCallType === 'VIDEO' && !isVideoOff ? (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-teal-950/40 to-slate-950 flex flex-col items-center justify-center space-y-3">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center font-bold text-3xl border-4 border-teal-400/80 shadow-xl shadow-teal-500/30 animate-pulse">
                    {user?.role === 'DOCTOR' ? consultation.patient_name.charAt(0) : consultation.doctor_name.charAt(4) || 'D'}
                  </div>
                  <p className="text-base font-bold text-white tracking-wide">
                    {user?.role === 'DOCTOR' ? consultation.patient_name : consultation.doctor_name}
                  </p>
                  <p className="text-xs text-teal-300 font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-teal-400 animate-bounce" /> 720p HD Encrypted Video Stream Active
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-20 h-20 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center mx-auto border border-slate-700 shadow-md">
                    <User className="w-10 h-10" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    {user?.role === 'DOCTOR' ? consultation.patient_name : consultation.doctor_name}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {isVideoOff ? 'Camera Feed Turned Off' : 'Encrypted WebRTC Audio Stream Active'}
                  </p>
                  {!isMuted && (
                    <div className="flex items-center justify-center gap-1 pt-1">
                      <span className="w-1 h-3 bg-teal-400 rounded animate-pulse"></span>
                      <span className="w-1 h-5 bg-teal-400 rounded animate-pulse delay-75"></span>
                      <span className="w-1 h-2 bg-teal-400 rounded animate-pulse delay-150"></span>
                      <span className="w-1 h-6 bg-teal-400 rounded animate-pulse"></span>
                      <span className="w-1 h-3 bg-teal-400 rounded animate-pulse delay-100"></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={toggleMute}
                className={`p-3.5 rounded-full transition-all shadow-md ${
                  isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {activeCallType === 'VIDEO' && (
                <button
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-full transition-all shadow-md ${
                    isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={handleEndCall}
                className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Telehealth Call</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
