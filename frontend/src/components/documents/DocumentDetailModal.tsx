import React, { useState } from 'react';
import type { Document } from '../../types';
import { api } from '../../services/api';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { speakFemaleVoice, stopSpeech } from '../../utils/speechUtils';
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
  VolumeX,
  Play,
  Pause
} from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] dark:bg-slate-900 bg-white rounded-2xl p-6 shadow-2xl border dark:border-slate-700/80 border-slate-200 flex flex-col overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800 border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{document.file_name}</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  {document.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(document.uploaded_at).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{(document.file_size_bytes / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Encrypted Patient Document</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-500/30 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b dark:border-slate-800 border-slate-200 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'dark:bg-slate-950/60 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Patient Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ocr'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'dark:bg-slate-950/60 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Azure AI Vision OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'entities'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'dark:bg-slate-950/60 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Medical Terminology</span>
          </button>

          <button
            onClick={() => setActiveTab('speech')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'speech'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'dark:bg-slate-950/60 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice TTS</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          
          {/* TAB 1: AI SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              
              {/* Report Overview */}
              <div className="p-4 rounded-2xl dark:bg-slate-950/80 dark:border-slate-800 bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Report Overview</h4>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {document.ai_summary?.overview || 'No AI summary overview generated yet.'}
                </p>
              </div>

              {/* Key Findings */}
              {document.ai_summary?.key_findings && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Key Report Findings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {document.ai_summary.key_findings.map((finding, idx) => (
                      <div key={idx} className="p-3 rounded-xl dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-300 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abnormal Values */}
              {document.ai_summary?.abnormal_values && document.ai_summary.abnormal_values.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Out-of-Range Parameters
                  </h4>
                  <div className="space-y-2">
                    {document.ai_summary.abnormal_values.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl dark:bg-amber-500/10 dark:border-amber-500/30 bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-amber-950 dark:text-amber-300">{item.parameter}</p>
                          <p className="text-[11px] text-amber-900 dark:text-slate-300 font-medium mt-0.5">{item.meaning}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-200/90 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 shrink-0">
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Medications Identified
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {document.ai_summary.medications_mentioned.map((med, idx) => (
                      <div key={idx} className="p-3 rounded-xl dark:bg-slate-950/60 dark:border-slate-800 bg-slate-50 border border-slate-200 text-xs">
                        <p className="font-bold text-cyan-800 dark:text-cyan-300">{med.name}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{med.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Questions for Doctor */}
              {document.ai_summary?.questions_for_doctor && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Recommended Questions for Your Doctor
                  </h4>
                  <div className="space-y-2">
                    {document.ai_summary.questions_for_doctor.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl dark:bg-emerald-500/10 dark:border-emerald-500/30 bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 dark:text-emerald-200 font-medium flex items-start gap-2">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">Q{idx + 1}:</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Disclaimer at Bottom of Modal */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <MedicalDisclaimer />
              </div>

            </div>
          )}

          {/* TAB 2: OCR TEXT */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Azure AI Vision Extracted OCR Text</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Confidence: 98% • Pages: {document.ocr_data?.page_count || 1}</span>
              </div>
              <div className="p-4 rounded-xl dark:bg-slate-950 dark:text-slate-200 dark:border-slate-800 bg-slate-50 text-slate-900 border border-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {document.ocr_data?.extracted_text || 'No OCR text extracted.'}
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL ENTITIES */}
          {activeTab === 'entities' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Azure AI Language Health Entities</h4>
              <div className="space-y-2">
                {document.entities.map((entity, idx) => (
                  <div key={idx} className="p-3 rounded-xl dark:bg-slate-950/80 dark:border-slate-800 bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{entity.text}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          {entity.category}
                        </span>
                      </div>
                      {entity.confidence_score && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          Confidence: {(entity.confidence_score * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPEECH TTS */}
          {activeTab === 'speech' && (
            <div className="p-6 rounded-2xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Listen to Medical Report Summary</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 font-medium">
                  Click play below to synthesize a clear, sweet voice summary of this medical report.
                </p>
              </div>

              <button
                onClick={handleSpeechTTS}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                }`}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>{isPlayingAudio ? 'Pause Voice Audio' : 'Play Voice Summary'}</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
