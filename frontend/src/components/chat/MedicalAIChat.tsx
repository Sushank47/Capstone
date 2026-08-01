import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { speakFemaleVoice, stopSpeech } from '../../utils/speechUtils';
import { Send, Bot, User as UserIcon, Volume2, VolumeX, FileText, Plus } from 'lucide-react';

interface Props {
  openUploadModal?: () => void;
  openAuthModal?: () => void;
}

export const MedicalAIChat: React.FC<Props> = ({ openUploadModal, openAuthModal }) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Default ON
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    "What does low hemoglobin mean?",
    "Explain fasting blood sugar level of 118 mg/dL",
    "What foods help build iron levels?",
    "Summarize my uploaded lab reports"
  ];

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        try {
          const res = await api.get<any[]>('/api/chat/history');
          if (res.data && res.data.length > 0) {
            const restoredMsgs: ChatMessage[] = [];
            res.data.forEach((entry) => {
              if (entry.user_message) restoredMsgs.push(entry.user_message);
              if (entry.assistant_message) restoredMsgs.push(entry.assistant_message);
            });
            setMessages(restoredMsgs);
            return;
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
            ? `Hello ${user.full_name.split(' ')[0]}! Ask me any question about your medical reports or lab values. You can also click the '+' button on the left to upload new documents.`
            : "Hello! Ask me any medical or lab report question. Click '+' to upload medical documents (Guest Mode: History is not saved unless you log in).",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: []
        }
      ]);
    };

    loadHistory();
    return () => {
      stopSpeech();
    };
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

      // Automatically speak with voice if Voice mode is enabled
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
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs dark:text-white text-slate-900">AI Medical Assistant</h3>
              {user ? (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">History Saved</span>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Guest Mode</span>
              )}
            </div>
          </div>
        </div>

        {/* Voice Toggle Button - Defaults to ON, removed word 'Female' */}
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
      </div>

      {/* Messages */}
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
              <div className="relative group">
                <div className={`p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white font-medium shadow-sm'
                    : 'dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 bg-white text-slate-800 border border-slate-200 shadow-sm'
                }`}>
                  {msg.text}
                </div>

                {/* Speaker Icon Button for Voice Playback */}
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handleSpeakMessage(msg.id, msg.text)}
                    className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                      speakingMsgId === msg.id
                        ? 'bg-teal-500 text-slate-950 border-teal-400 animate-pulse'
                        : 'dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:text-teal-400 bg-slate-100 text-slate-600 border-slate-200 hover:text-teal-600'
                    }`}
                    title="Listen Voice"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{speakingMsgId === msg.id ? 'Speaking...' : 'Listen Voice'}</span>
                  </button>
                )}
              </div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="p-2.5 rounded-lg text-left space-y-1 dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Sources ({msg.citations.length})
                  </p>
                  {msg.citations.map((cite, idx) => (
                    <div key={idx} className="text-[11px] dark:text-slate-300 text-slate-700">
                      • <strong className="dark:text-white text-slate-900">{cite.document_name}</strong>: "{cite.snippet}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs dark:text-slate-400 text-slate-600">
            <Bot className="w-4 h-4 text-teal-500 animate-spin" />
            <span>AI is typing response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      {messages.length < 4 && (
        <div className="px-5 py-2 border-t flex items-center gap-2 overflow-x-auto shrink-0 dark:border-slate-800/60 border-slate-200">
          <span className="text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase shrink-0">Try:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1 rounded-full text-xs border whitespace-nowrap transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar with Left + Upload File Button */}
      <div className="p-3.5 border-t shrink-0 dark:border-slate-800 dark:bg-slate-900/90 border-slate-200 bg-slate-100/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Left + Button for File Upload */}
          <button
            type="button"
            onClick={() => {
              if (user && openUploadModal) {
                openUploadModal();
              } else if (openAuthModal) {
                openAuthModal();
              }
            }}
            className="p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-teal-400 dark:border-slate-700 bg-white hover:bg-slate-200 text-teal-600 border-slate-300"
            title={user ? "Upload medical document / report" : "Sign in to upload medical documents"}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a medical or lab report question..."
            className="flex-1 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-teal-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder-slate-500 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              loading || !input.trim()
                ? 'dark:bg-slate-800 dark:text-slate-500 bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

    </div>
  );
};
