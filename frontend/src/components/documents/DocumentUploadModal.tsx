import React, { useState } from 'react';
import type { DocumentCategory } from '../../types';
import { api } from '../../services/api';
import { X, UploadCloud, FileText, CheckCircle2, Cpu, Eye, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const DocumentUploadModal: React.FC<Props> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('Blood Report');
  const [tags, setTags] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a medical report file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      setPipelineStep('1. Encrypting & Uploading to Azure Blob Storage...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('tags', tags);

      // Trigger upload which executes Azure AI Vision OCR, NLP, Azure OpenAI & Search
      await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPipelineStep('Done! Processing Complete.');
      onUploadSuccess();
      onClose();
      setFile(null);
      setTags('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process document through Azure AI pipeline.');
    } finally {
      setIsUploading(false);
      setPipelineStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl border border-slate-700/80">
        
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <UploadCloud className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Upload Medical Document</h3>
            <p className="text-xs text-slate-400">Azure AI Vision OCR • Text Analytics • RAG Vector Indexing</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
              file
                ? 'border-teal-500 bg-teal-500/10'
                : 'border-slate-700 hover:border-teal-500/50 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-teal-400" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">{file.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Medical PDF'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-auto p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="w-10 h-10 text-teal-400 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-white">Click to upload or drag & drop</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG scanned reports (Max 25MB)</p>
              </label>
            )}
          </div>

          {/* Document Category */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="Blood Report">Blood Report (CBC, Lipid, Metabolic Panel)</option>
              <option value="Prescription">Prescription & Medication Notes</option>
              <option value="X-Ray / Scan">X-Ray / MRI / Radiology Scan</option>
              <option value="Lab Report">Laboratory / Pathology Test</option>
              <option value="Discharge Summary">Hospital Discharge Summary</option>
              <option value="Doctor Note">Doctor Clinical Notes</option>
              <option value="Medical Bill">Medical Bill / Invoice</option>
              <option value="Other">Other Healthcare Document</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Optional)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Annual, Fasting, Hematology, Dr. Vance"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Pipeline Status Indicator */}
          {isUploading && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-teal-300 font-medium">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
                  <span>Processing Azure AI Pipeline...</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{pipelineStep}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || !file}
            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
              isUploading || !file
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-teal-500/20'
            }`}
          >
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Upload & Process with Azure AI</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
