import React, { useState } from 'react';
import type { Document } from '../../types';
import { api } from '../../services/api';
import {
  FileText,
  Search,
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 clean-card p-4 rounded-2xl border dark:border-slate-800 border-slate-200">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports, tags, lab values..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 dark:bg-slate-950/60 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 dark:bg-slate-950/60 dark:border-slate-700 dark:text-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
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
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                : 'bg-slate-50 text-slate-600 border-slate-300 dark:bg-slate-950/60 dark:text-slate-400 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span>Starred</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openUploadModal}
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Report</span>
          </button>
        </div>

      </div>

      {/* Document Grid / List View */}
      {filteredDocs.length === 0 ? (
        <div className="py-16 text-center clean-card rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">No Documents Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No medical reports match your search criteria. Click 'Upload Report' to add new blood work or prescriptions.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className="group cursor-pointer clean-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                        {doc.file_name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleToggleFavorite(doc, e)}
                    className="text-slate-400 hover:text-amber-400 transition-colors p-1"
                  >
                    <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                    {doc.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                  {doc.ai_summary?.overview || doc.ocr_data?.extracted_text || 'Report indexed in Medical Vault.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:underline">
                  <Eye className="w-3.5 h-3.5" /> Inspect Summary
                </span>

                <button
                  onClick={(e) => handleDelete(doc, e)}
                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="clean-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="p-4 hover:bg-slate-100 dark:hover:bg-slate-900/60 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{doc.file_name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 uppercase">
                    {doc.category}
                  </span>

                  <button
                    onClick={(e) => handleToggleFavorite(doc, e)}
                    className="text-slate-400 hover:text-amber-400 p-1"
                  >
                    <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleDelete(doc, e)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
