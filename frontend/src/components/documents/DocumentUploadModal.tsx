import React, { useState } from 'react';
import type { DocumentCategory } from '../../types';
import { api } from '../../services/api';
import { X, UploadCloud, FileText, Cpu } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg dark:bg-slate-900 bg-white rounded-2xl p-6 shadow-2xl border dark:border-slate-700/80 border-slate-200 transition-colors duration-200">
        
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-4 right-4 p-1.5 rounded-lg dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Upload Medical Document</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Azure AI Vision OCR • Text Analytics • RAG Vector Indexing</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
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
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-500/50 bg-slate-50 dark:bg-slate-950/40'
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
                <FileText className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Medical PDF'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-auto p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="w-10 h-10 text-teal-600 dark:text-teal-400 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Click to upload or drag & drop</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Supports PDF, PNG, JPG (Blood work, X-Ray, Prescriptions, Reports)</p>
              </label>
            )}
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="Blood Report">Blood Report</option>
              <option value="Prescription">Prescription</option>
              <option value="X-Ray / Scan">X-Ray / Scan</option>
              <option value="Lab Report">Lab Report</option>
              <option value="Discharge Summary">Discharge Summary</option>
              <option value="Doctor Note">Doctor Note</option>
              <option value="Medical Bill">Medical Bill</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags (Comma Separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. CBC, Hemoglobin, Fasting, 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Pipeline Step Progress indicator */}
          {isUploading && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-spin shrink-0" />
              <span className="font-semibold">{pipelineStep || 'Executing Azure AI Vision OCR & RAG Indexing...'}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || !file}
            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
              isUploading || !file
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-teal-500/20'
            }`}
          >
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Process & Save to Vault</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
