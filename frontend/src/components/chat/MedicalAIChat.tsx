import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Consultation } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { speakFemaleVoice, stopSpeech } from '../../utils/speechUtils';
import { Send, Bot, User as UserIcon, Volume2, VolumeX, Trash2, Phone, Video, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

interface Props {
  openUploadModal?: () => void;
  openAuthModal?: () => void;
}

export const MedicalAIChat: React.FC<Props> = ({ openUploadModal, openAuthModal }) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'CHAT' | 'CALL_HISTORY'>('CHAT');
  const [callHistory, setCallHistory] = useState<Consultation[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    "What does low hemoglobin mean?",
    "Explain fasting blood sugar level of 118 mg/dL",
    "What foods help build iron levels?",
    "Summarize my uploaded lab reports"
  ];

  const loadHistory = async () => {
    if (user) {
      try {
        const res = await api.get<any[]>('/api/chat/history');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const restoredMsgs: ChatMessage[] = [];
          res.data.forEach((entry) => {
            if (entry?.user_message) {
              restoredMsgs.push({
                id: entry.user_message.id || String(Math.random()),
                sender: 'user',
                text: typeof entry.user_message.text === 'string' ? entry.user_message.text : String(entry.user_message.text || ''),
                timestamp: entry.user_message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                citations: []
              });
            }
            if (entry?.assistant_message) {
              restoredMsgs.push({
                id: entry.assistant_message.id || String(Math.random()),
                sender: 'assistant',
                text: typeof entry.assistant_message.text === 'string' ? entry.assistant_message.text : String(entry.assistant_message.text || ''),
                timestamp: entry.assistant_message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                citations: Array.isArray(entry.assistant_message.citations) ? entry.assistant_message.citations : []
              });
            }
          });
          if (restoredMsgs.length > 0) {
            setMessages(restoredMsgs);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to restore chat history', e);
      }
    }

    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: user
          ? `Hello ${user?.full_name ? user.full_name.split(' ')[0] : 'Patient'}! Ask me any question about your medical reports or lab values. You can also clear chat history anytime.`
          : "Hello! Ask me any medical or lab report question (Guest Mode: History is not saved unless you log in).",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: []
      }
    ]);
  };

  const fetchCallHistory = async () => {
    if (!user) return;
    setLoadingCalls(true);
    try {
      const res = await api.get<Consultation[]>('/api/doctors/consultations/my');
      setCallHistory(res.data || []);
    } catch {
      console.error('Failed to load consultation call history');
    } finally {
      setLoadingCalls(false);
    }
  };

  useEffect(() => {
    loadHistory();
    if (user) fetchCallHistory();
    return () => {
      stopSpeech();
    };
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (viewMode === 'CHAT') {
      scrollToBottom();
    }
  }, [messages, loading, viewMode]);

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      stopSpeech();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      speakFemaleVoice(text, () => {
        setSpeakingMsgId(null);
      });
    }
  };

  const handleClearHistory = async () => {
    if (user) {
      try {
        await api.delete('/api/chat/history');
      } catch (e) {
        console.error('Failed to clear chat history on backend', e);
      }
    }
    stopSpeech();
    setSpeakingMsgId(null);
    setMessages([
      {
        id: 'welcome_cleared',
        sender: 'assistant',
        text: user
          ? `Chat history cleared! Ask me a new question about your lab results or health symptoms.`
          : "Chat history cleared!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: []
      }
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: []
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/chat', {
        message: queryText,
        voice_enabled: voiceEnabled
      });

      const botMsgText = res.data.assistant_message.text;
      const botMsgId = res.data.assistant_message.id;

      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'assistant',
        text: botMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.data.assistant_message.citations || []
      };

      setMessages((prev) => [...prev, botMsg]);

      if (voiceEnabled) {
        setSpeakingMsgId(botMsgId);
        speakFemaleVoice(botMsgText, () => {
          setSpeakingMsgId(null);
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: "I experienced an error connecting to the medical AI search engine. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col clean-card overflow-hidden transition-colors duration-200">
      
      {/* Top Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between shrink-0 dark:border-slate-800 dark:bg-slate-900/60 border-slate-200 bg-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs dark:text-white text-slate-900">AI Medical Assistant</h3>
              {user ? (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Persistent Vault History</span>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Guest Mode</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2">

          {/* Sub-tab view switchers */}
          {user && (
            <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-950 rounded-xl border border-slate-300 dark:border-slate-800">
              <button
                onClick={() => setViewMode('CHAT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'CHAT'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                AI Chat
              </button>
              <button
                onClick={() => {
                  setViewMode('CALL_HISTORY');
                  fetchCallHistory();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'CALL_HISTORY'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call History</span>
              </button>
            </div>
          )}

          {/* Clear History Button */}
          {viewMode === 'CHAT' && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold dark:bg-slate-900 dark:text-rose-400 dark:border-slate-800 dark:hover:bg-slate-800 bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 transition-all"
              title="Clear Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
          )}

          {/* Voice Toggle Button */}
          {viewMode === 'CHAT' && (
            <button
              onClick={() => {
                const nextVoice = !voiceEnabled;
                setVoiceEnabled(nextVoice);
                if (!nextVoice) stopSpeech();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                voiceEnabled
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-sm'
                  : 'dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Voice {voiceEnabled ? 'On' : 'Off'}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE: CALL & CONSULTATION HISTORY */}
      {viewMode === 'CALL_HISTORY' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-teal-500" /> Doctor Telehealth Call & Consultation History
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Calls: <strong>{callHistory.length}</strong>
            </span>
          </div>

          {loadingCalls ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Loading call logs...</div>
          ) : callHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Phone className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No previous telehealth calls found in your record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {callHistory.map((call) => (
                <div
                  key={call.id}
                  className="p-4 rounded-xl dark:bg-slate-950/70 dark:border-slate-800 bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {user?.role === 'DOCTOR' ? `Patient: ${call.patient_name}` : call.doctor_name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        call.status === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      }`}>
                        {call.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Inquiry: "{call.symptoms_note}"
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-teal-500" /> {new Date(call.created_at).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> WebRTC HD Audio/Video Call Recorded
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE: AI CHAT */
        <>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold ${
                  msg.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'dark:bg-slate-800 dark:text-teal-400 dark:border-slate-700 bg-slate-200 text-teal-700 border border-slate-300'
                }`}>
                  {msg.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed inline-block shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-teal-500 text-slate-950 font-semibold rounded-tr-none'
                      : 'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>

                  {msg.citations && Array.isArray(msg.citations) && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 text-[10px]">
                      {msg.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-mono"
                        >
                          📄 {c.document_name} ({c.relevance_score ? `${(c.relevance_score * 100).toFixed(0)}% match` : 'Ref'})
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => handleSpeakMessage(msg.id, msg.text)}
                        className="hover:text-teal-500 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <Volume2 className={`w-3 h-3 ${speakingMsgId === msg.id ? 'text-teal-400 animate-bounce' : ''}`} />
                        <span>{speakingMsgId === msg.id ? 'Speaking...' : 'Listen'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 animate-pulse font-medium">
                <Bot className="w-4 h-4" /> Analyzing Azure OpenAI RAG index...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-5 py-2 border-t dark:border-slate-800/80 border-slate-200 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:border-teal-500/50 bg-white text-slate-700 border border-slate-200 hover:border-teal-500 transition-all shrink-0 shadow-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t dark:border-slate-800 border-slate-200 flex items-center gap-2 shrink-0 dark:bg-slate-900/50 bg-white"
          >
            {openUploadModal && (
              <button
                type="button"
                onClick={openUploadModal}
                className="p-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 transition-all"
                title="Upload Report Document"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "Ask AI Assistant about your medical tests..." : "Type health question... (Sign in to save chat)"}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </>
      )}

    </div>
  );
};
