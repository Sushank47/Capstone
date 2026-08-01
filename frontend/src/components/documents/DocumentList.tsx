import React, { useState } from 'react';
import type { Document, DocumentCategory } from '../../types';
import { api } from '../../services/api';
import {
  FileText,
  Search,
  Filter,
  Star,
  Download,
  Trash2,
  Eye,
  Calendar,
  Grid,
  List as ListIcon,
  Tag,
  Plus
} from 'lucide-react';

interface Props {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  onRefresh: () => void;
  openUploadModal: () => void;
}

export const DocumentList: React.FC<Props> = ({
  documents,
  onSelectDocument,
  onRefresh,
  openUploadModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleToggleFavorite = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/api/documents/${doc.id}`, { is_favorite: !doc.is_favorite });
      onRefresh();
    } catch {
      alert('Failed to update favorite status.');
    }
  };

  const handleDelete = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete '${doc.file_name}'?`)) return;
    try {
      await api.delete(`/api/documents/${doc.id}`);
      onRefresh();
    } catch {
      alert('Failed to delete document.');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) return false;
    if (favoriteOnly && !doc.is_favorite) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const fname = doc.file_name.toLowerCase();
      const cat = doc.category.toLowerCase();
      const tags = doc.tags.join(' ').toLowerCase();
      if (!fname.includes(term) && !cat.includes(term) && !tags.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-700/60">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports, tags, lab values..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Blood Report">Blood Report</option>
            <option value="Prescription">Prescription</option>
            <option value="X-Ray / Scan">X-Ray / Scan</option>
            <option value="Lab Report">Lab Report</option>
            <option value="Discharge Summary">Discharge Summary</option>
            <option value="Doctor Note">Doctor Note</option>
            <option value="Medical Bill">Medical Bill</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              favoriteOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Starred</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Document Grid/List Container */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Medical Documents Found</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Upload your blood reports, prescriptions, or X-rays to get started with Azure AI explanations.
          </p>
          <button
            onClick={openUploadModal}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all"
          >
            Upload First Report
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className="group glass-card p-5 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all duration-200 cursor-pointer relative flex flex-col justify-between hover:shadow-xl hover:shadow-teal-500/5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleFavorite(doc, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(doc, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {doc.category}
                </span>

                <h4 className="text-sm font-bold text-white mt-2 group-hover:text-teal-300 transition-colors line-clamp-1">
                  {doc.file_name}
                </h4>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {doc.ai_summary?.overview || 'Report processed with Azure AI Vision.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>

                <span className="text-[11px] font-semibold text-teal-400 group-hover:underline flex items-center gap-1">
                  View Breakdown →
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Report Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Uploaded</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-semibold text-white flex items-center gap-3">
                    <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{doc.file_name}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleToggleFavorite(doc, e)}
                        className="p-1 rounded text-slate-500 hover:text-amber-400"
                      >
                        <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(doc, e)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
