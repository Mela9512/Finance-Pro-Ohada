import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen, Upload, Search, Download, Trash2, FileText, File,
  FileSpreadsheet, Image, Archive, Eye, Link, Tag, Calendar,
  CheckCircle2, AlertTriangle, RefreshCw, X, Plus, ShieldCheck,
  BarChart2, HardDrive, Filter
} from 'lucide-react';
import { GedDocument, DocumentCategory, GedStats } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES: { id: DocumentCategory | 'ALL'; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'ALL',            label: 'Tous les documents', icon: '📁', color: 'text-slate-600', bg: 'bg-slate-50' },
  { id: 'FACTURE_ACHAT',  label: 'Factures Achat',    icon: '🛒', color: 'text-rose-600',  bg: 'bg-rose-50'  },
  { id: 'FACTURE_VENTE',  label: 'Factures Vente',    icon: '💼', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'RELEVE_BANCAIRE',label: 'Relevés Bancaires', icon: '🏦', color: 'text-blue-600',  bg: 'bg-blue-50'  },
  { id: 'CONTRAT',        label: 'Contrats',           icon: '📜', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'BULLETIN_PAIE',  label: 'Bulletins de Paie', icon: '👤', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'FISCAL_DSF',     label: 'DSF & Fiscalité',   icon: '⚖️', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'IMMOBILISATION', label: 'Immobilisations',   icon: '🏗️', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'DIVERS',         label: 'Divers',             icon: '📎', color: 'text-slate-500', bg: 'bg-slate-50' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

const getMimeIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-rose-500" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
  if (mimeType.includes('image')) return <Image className="w-8 h-8 text-blue-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-8 h-8 text-amber-500" />;
  return <File className="w-8 h-8 text-slate-400" />;
};

const getCategoryConfig = (id: string) =>
  CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (doc: GedDocument) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('DIVERS');
  const [linkedPieceNumber, setLinkedPieceNumber] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setDocName(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);
    setProgress(10);

    // Simulate progress bar
    const interval = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300);

    try {
      const doc = await api.uploadDocument(selectedFile, {
        name: docName || selectedFile.name,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        linkedPieceNumber: linkedPieceNumber.trim() || undefined,
      });
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        onSuccess(doc);
        onClose();
      }, 400);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setError(err instanceof ApiError ? err.message : 'Erreur lors du téléversement');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Téléverser un document</h2>
              <p className="text-xs text-slate-500">Format PDF, Excel, image — 20 Mo max</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver ? 'border-violet-400 bg-violet-50' :
              selectedFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.zip,.doc,.docx"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                {getMimeIcon(selectedFile.type)}
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Glissez votre fichier ici</p>
                <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir</p>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nom du document</label>
            <input
              type="text"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="Ex: Facture Orange Août 2026"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Catégorie</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {CATEGORIES.filter(c => c.id !== 'ALL').map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Linked piece */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              <Link className="w-3 h-3 inline mr-1" />
              Lier à une pièce comptable (optionnel)
            </label>
            <input
              type="text"
              value={linkedPieceNumber}
              onChange={e => setLinkedPieceNumber(e.target.value)}
              placeholder="Ex: AC-2026-014 ou VT-2026-001"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              <Tag className="w-3 h-3 inline mr-1" />
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Ex: urgent, orange, telecom"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Téléversement en cours...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Téléversement...' : 'Téléverser'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocCardProps {
  doc: GedDocument;
  onDownload: (doc: GedDocument) => void;
  onDelete: (doc: GedDocument) => void;
}

const DocCard: React.FC<DocCardProps> = ({ doc, onDownload, onDelete }) => {
  const cat = getCategoryConfig(doc.category);

  return (
    <div className="group bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:border-violet-200 transition-all duration-200 flex flex-col gap-3">
      {/* Icon + Name */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0 text-xl`}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
          <p className="text-xs text-slate-400 truncate">{doc.originalName}</p>
        </div>
      </div>

      {/* Category badge + size */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.bg} ${cat.color}`}>
          {cat.label}
        </span>
        <span className="text-[10px] text-slate-400">{formatSize(Number(doc.size))}</span>
      </div>

      {/* Linked piece */}
      {doc.linkedPieceNumber && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg">
          <Link className="w-3 h-3 text-indigo-500" />
          <span className="text-[10px] font-bold text-indigo-600 font-mono">{doc.linkedPieceNumber}</span>
        </div>
      )}

      {/* Tags */}
      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.slice(0, 3).map(t => (
            <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md">#{t}</span>
          ))}
        </div>
      )}

      {/* SHA256 fingerprint */}
      {doc.sha256 && (
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-600">
          <ShieldCheck className="w-3 h-3" />
          <span className="font-mono truncate">{doc.sha256.substring(0, 16)}…</span>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        <Calendar className="w-3 h-3" />
        {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-slate-50">
        <button
          onClick={() => onDownload(doc)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs hover:bg-violet-100 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Télécharger
        </button>
        <button
          onClick={() => onDelete(doc)}
          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Module ──────────────────────────────────────────────────────────────

const DocumentsModule: React.FC = () => {
  const [documents, setDocuments] = useState<GedDocument[]>([]);
  const [stats, setStats] = useState<GedStats>({ count: 0, totalSize: 0 });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const [docs, st] = await Promise.all([
        api.getDocuments(activeCategory !== 'ALL' ? activeCategory : undefined),
        api.getDocumentStats(),
      ]);
      setDocuments(docs);
      setStats(st);
    } catch (err) {
      setErrorMessage('Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeCategory]);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) { const t = setTimeout(() => setSuccessMessage(null), 4000); return () => clearTimeout(t); }
  }, [successMessage]);
  useEffect(() => {
    if (errorMessage) { const t = setTimeout(() => setErrorMessage(null), 5000); return () => clearTimeout(t); }
  }, [errorMessage]);

  const handleDownload = async (doc: GedDocument) => {
    try {
      const { url } = await api.getDocumentDownloadUrl(doc.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName;
      link.target = '_blank';
      link.click();
    } catch {
      // Fallback: open storageUrl if available
      if (doc.storageUrl) {
        window.open(doc.storageUrl, '_blank');
      } else {
        setErrorMessage('Le lien de téléchargement est temporairement indisponible.');
      }
    }
  };

  const handleDelete = async (doc: GedDocument) => {
    if (!window.confirm(`Supprimer définitivement "${doc.name}" ?\nCette action est irréversible.`)) return;
    setDeletingId(doc.id);
    try {
      await api.deleteDocument(doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setStats(prev => ({ count: prev.count - 1, totalSize: prev.totalSize - Number(doc.size) }));
      setSuccessMessage(`Document "${doc.name}" supprimé avec succès.`);
    } catch {
      setErrorMessage('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadSuccess = (doc: GedDocument) => {
    setDocuments(prev => [doc, ...prev]);
    setStats(prev => ({ count: prev.count + 1, totalSize: prev.totalSize + Number(doc.size) }));
    setSuccessMessage(`"${doc.name}" téléversé avec succès et empreinte SHA-256 calculée.`);
  };

  // Filter documents
  const filtered = documents.filter(doc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.originalName.toLowerCase().includes(q) ||
      (doc.linkedPieceNumber || '').toLowerCase().includes(q) ||
      (doc.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  // Count per category
  const countByCategory = (catId: string) => {
    if (catId === 'ALL') return documents.length;
    return documents.filter(d => d.category === catId).length;
  };

  return (
    <div className="flex h-full gap-0">
      {/* ── Left Sidebar ────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-100 bg-white p-4 space-y-1 flex flex-col">
        {/* Stats */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-4 mb-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 opacity-80" />
            <span className="text-xs font-bold opacity-80">Stockage GED</span>
          </div>
          <div className="text-2xl font-black">{stats.count}</div>
          <div className="text-xs opacity-80 mt-0.5">documents</div>
          <div className="mt-2 pt-2 border-t border-white/20 text-xs font-bold opacity-90">
            {formatSize(stats.totalSize)} utilisés
          </div>
        </div>

        {/* Category list */}
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
          Catégories
        </div>
        {CATEGORIES.map(cat => {
          const count = countByCategory(cat.id);
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-semibold ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className="flex-1 truncate">{cat.label}</span>
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Compliance badge */}
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold text-emerald-700">Conforme SYSCOHADA</p>
              <p className="text-[9px] text-emerald-600">Empreinte SHA-256 sur chaque fichier</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-violet-600" />
              GED — Gestionnaire de Documents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {getCategoryConfig(activeCategory).icon} {getCategoryConfig(activeCategory).label}
              {' '}· {filtered.length} document{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 w-48"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchDocuments}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Upload button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Téléverser
            </button>
          </div>
        </div>

        {/* Toast messages */}
        {successMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {successMessage}
            <button onClick={() => setSuccessMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            {errorMessage}
            <button onClick={() => setErrorMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Chargement des documents…</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">Aucun document</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                {searchQuery ? 'Aucun résultat pour cette recherche' : 'Téléversez votre premier document'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Téléverser un document
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(doc => (
                <div key={doc.id} className={`transition-opacity ${deletingId === doc.id ? 'opacity-40 pointer-events-none' : ''}`}>
                  <DocCard
                    doc={doc}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default DocumentsModule;
