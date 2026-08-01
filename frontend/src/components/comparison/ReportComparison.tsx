import React, { useState } from 'react';
import type { Document, ReportComparisonResponse } from '../../types';
import { api } from '../../services/api';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { GitCompare, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  documents: Document[];
}

export const ReportComparison: React.FC<Props> = ({ documents }) => {
  const [doc1Id, setDoc1Id] = useState<string>(documents[0]?.id || '');
  const [doc2Id, setDoc2Id] = useState<string>(documents[1]?.id || documents[0]?.id || '');
  
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ReportComparisonResponse | null>(null);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!doc1Id || !doc2Id) {
      setError('Please select two reports to compare.');
      return;
    }
    if (doc1Id === doc2Id) {
      setError('Please select two different reports for comparison.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post<ReportComparisonResponse>('/api/ai/compare', {
        document_id_1: doc1Id,
        document_id_2: doc2Id,
      });
      setComparisonResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report comparison analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Selector Box */}
      <div className="clean-card p-6 rounded-2xl border dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Side-by-Side Lab Value Progression</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select two historical medical reports to analyze trends, improvements, or parameters requiring attention.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Baseline Report (Earlier Date)</label>
            <select
              value={doc1Id}
              onChange={(e) => setDoc1Id(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name} ({new Date(d.uploaded_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Follow-up Report (Recent Date)</label>
            <select
              value={doc2Id}
              onChange={(e) => setDoc2Id(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/70 dark:border-slate-700 dark:text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name} ({new Date(d.uploaded_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || documents.length < 2}
          className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
            loading || documents.length < 2
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-teal-500/20'
          }`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Report Progression Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Comparison Results Card */}
      {comparisonResult && (
        <div className="clean-card p-6 rounded-2xl border dark:border-slate-800 border-slate-200 space-y-6 animate-in fade-in duration-300">
          
          {/* Summary Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Historical Trend Summary</h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {comparisonResult.comparison_summary}
            </p>
          </div>

          {/* 3 Grid Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Improved Metrics */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Improved Biomarkers ({comparisonResult.improved_metrics.length})
              </h4>
              <ul className="space-y-2">
                {comparisonResult.improved_metrics.map((m, idx) => (
                  <li key={idx} className="text-xs text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 font-medium">
                    ✓ {m}
                  </li>
                ))}
              </ul>
            </div>

            {/* Worsened / Need Attention */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Needs Attention ({comparisonResult.worsened_metrics.length})
              </h4>
              <ul className="space-y-2">
                {comparisonResult.worsened_metrics.map((m, idx) => (
                  <li key={idx} className="text-xs text-amber-950 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20 font-medium">
                    ⚠️ {m}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stable Metrics */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
              <h4 className="text-xs font-bold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Minus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Stable Parameters ({comparisonResult.stable_metrics.length})
              </h4>
              <ul className="space-y-2">
                {comparisonResult.stable_metrics.map((m, idx) => (
                  <li key={idx} className="text-xs text-cyan-950 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-200 dark:border-cyan-500/20 font-medium">
                    • {m}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Doctor Discussion Recommendations */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider mb-3">Recommended Topics to Discuss With Your Doctor</h4>
            <div className="space-y-2">
              {comparisonResult.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* MEDICAL DISCLAIMER PLACED AT THE BOTTOM */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <MedicalDisclaimer />
      </div>

    </div>
  );
};
