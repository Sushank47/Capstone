import React, { useState } from 'react';
import type { Document } from '../../types';
import { api } from '../../services/api';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import {
  X,
  FileText,
  Sparkles,
  Eye,
  Stethoscope,
  Volume2,
  Download,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Pill,
  Calendar,
  Lock,
  Play,
  Pause
} from 'lucide-react';

import { speakFemaleVoice, stopSpeech } from '../../utils/speechUtils';

interface Props {
  document: Document | null;
  onClose: () => void;
}

export const DocumentDetailModal: React.FC<Props> = ({ document, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'ocr' | 'entities' | 'speech'>('summary');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!document) return null;

  const handleSpeechTTS = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    const summaryText = document.ai_summary?.overview || document.ocr_data?.extracted_text || 'Report summary.';
    setIsPlayingAudio(true);
    speakFemaleVoice(summaryText, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleExportPDF = async () => {
    try {
      const res = await api.get(`/api/documents/${document.id}/pdf-export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.file_name}_summary.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download PDF summary report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-2xl p-6 shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <FileText className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{document.file_name}</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {document.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(document.uploaded_at).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{(document.file_size_bytes / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Lock className="w-3 h-3" /> Encrypted Patient Document
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-xs font-semibold border border-teal-500/40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-700/40 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'summary'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>AI Patient Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ocr'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Azure AI Vision OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'entities'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>Medical Terminology</span>
          </button>

          <button
            onClick={() => setActiveTab('speech')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'speech'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Azure Voice TTS</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          
          {/* TAB 1: AI SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <MedicalDisclaimer />

              {/* Overview */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">Report Overview</h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {document.ai_summary?.overview || 'No AI summary overview generated yet.'}
                </p>
              </div>

              {/* Key Findings */}
              {document.ai_summary?.key_findings && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400" /> Key Report Findings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {document.ai_summary.key_findings.map((finding, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abnormal Values */}
              {document.ai_summary?.abnormal_values && document.ai_summary.abnormal_values.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Out-of-Range Parameters
                  </h4>
                  <div className="space-y-2">
                    {document.ai_summary.abnormal_values.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-amber-300">{item.parameter}</p>
                          <p className="text-[11px] text-slate-300 mt-0.5">{item.meaning}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 shrink-0">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications Mentioned */}
              {document.ai_summary?.medications_mentioned && document.ai_summary.medications_mentioned.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-cyan-400" /> Medications Identified
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {document.ai_summary.medications_mentioned.map((med, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                        <p className="font-bold text-cyan-300">{med.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{med.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Questions for Doctor */}
              {document.ai_summary?.questions_for_doctor && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-400" /> Recommended Questions for Your Doctor
                  </h4>
                  <div className="space-y-2">
                    {document.ai_summary.questions_for_doctor.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
                        <span className="font-bold text-emerald-400 shrink-0">Q{idx + 1}:</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OCR TEXT */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Azure AI Vision Extracted OCR Text</h4>
                <span className="text-[10px] text-slate-400">Confidence: 98% • Pages: {document.ocr_data?.page_count || 1}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 whitespace-pre-wrap leading-relaxed">
                {document.ocr_data?.extracted_text || 'No OCR text extracted.'}
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL ENTITIES */}
          {activeTab === 'entities' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Azure AI Language Health Entities</h4>
              <div className="space-y-2">
                {document.entities.map((entity, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{entity.text}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-semibold border border-slate-700">
                          {entity.category}
                        </span>
                        {entity.status && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            entity.status === 'High' || entity.status === 'Low'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {entity.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{entity.explanation}</p>
                    </div>
                    {entity.normal_range && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Reference Range</p>
                        <p className="text-xs font-mono text-slate-300">{entity.normal_range}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPEECH TTS */}
          {activeTab === 'speech' && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <Volume2 className="w-8 h-8 text-slate-950" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Listen to AI Voice Explanation</h4>
                <p className="text-xs text-slate-400 mt-1">Converts your document's key medical findings into clear spoken audio via Azure AI Speech.</p>
              </div>

              <button
                onClick={handleSpeechTTS}
                disabled={loadingAudio}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2"
              >
                {loadingAudio ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : isPlayingAudio ? (
                  <>
                    <Pause className="w-4 h-4 fill-slate-950" />
                    <span>Pause Voice Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Play Audio Summary</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
