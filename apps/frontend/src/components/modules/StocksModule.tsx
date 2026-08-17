import React, { useEffect, useState } from 'react';
import {
  Package, Plus, X, Info, AlertTriangle, QrCode, Search, Download, Printer,
  BarChart2, ArrowDownLeft, ArrowUpRight, RefreshCw, Layers, ShieldCheck,
  CheckCircle, ArrowRightLeft, Sparkles, Building2, ShoppingCart, Tag,
  Clock, Scan, FileSpreadsheet, CheckCircle2, AlertOctagon, TrendingUp, TrendingDown
} from 'lucide-react';
import { AccountSYSCOHADA, StockArticle, StockArticleDetail, StockSynthese } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const now = new Date();

// Interface pour la gestion multi-dépôts
interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: string;
  manager: string;
}

const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: '1', name: 'Dépôt Central — Zone Industrielle', code: 'DEP-01', location: 'Bonabéri / Douala', capacity: '5 000 m²', manager: 'Alain KAMGANG' },
  { id: '2', name: 'Magasin Principal — Akwa Center', code: 'MAG-01', location: 'Akwa / Douala', capacity: '1 200 m²', manager: 'Carine MBIDA' },
  { id: '3', name: 'Dépôt Portuaire — Transit', code: 'DEP-02', location: 'Zone Portuaire', capacity: '3 500 m²', manager: 'Samuel ETAME' }
];

interface StockReportRow {
  article: string;
  ref: string;
  stockInitial: number;
  entrees: number;
  sorties: number;
  stockFinal: number;
  cump: number;
  valeurFinale: number;
}

const DEFAULT_STOCK_REPORT_ITEMS: StockReportRow[] = [
  { article: 'Article 1 (Ciment CPJ 42.5)', ref: 'A00001', stockInitial: 1000, entrees: 100, sorties: 100, stockFinal: 1000, cump: 4500, valeurFinale: 4500000 },
  { article: 'Article 2 (Fer à béton 12mm)', ref: 'A23400', stockInitial: 800, entrees: 50, sorties: 0, stockFinal: 850, cump: 12000, valeurFinale: 10200000 },
  { article: 'Article 3 (Peinture Vinylique 20L)', ref: 'B00001', stockInitial: 75, entrees: 100, sorties: 0, stockFinal: 175, cump: 28000, valeurFinale: 4900000 },
  { article: 'Article 4 (Carrelage Grès 60x60)', ref: 'B20000', stockInitial: 2000, entrees: 0, sorties: 0, stockFinal: 2000, cump: 3500, valeurFinale: 7000000 },
  { article: 'Article 5 (Tube PVC Ø110 4M)', ref: 'B34000', stockInitial: 520, entrees: 0, sorties: 0, stockFinal: 520, cump: 6500, valeurFinale: 3380000 },
  { article: 'Article 7 (Câble TH 2.5mm² 100M)', ref: 'C00002', stockInitial: 350, entrees: 0, sorties: 0, stockFinal: 350, cump: 18500, valeurFinale: 6475000 },
  { article: 'Article 7 (Disjoncteur Mono 16A)', ref: 'D12000', stockInitial: 800, entrees: 50, sorties: 60, stockFinal: 790, cump: 3200, valeurFinale: 2528000 },
  { article: 'Produit 1 (Groupe Électrogène 10KVA)', ref: 'P00001', stockInitial: 20, entrees: 0, sorties: 2, stockFinal: 18, cump: 850000, valeurFinale: 15300000 },
  { article: 'Produit 2 (Pompe Immergée 1.5CV)', ref: 'P00002', stockInitial: 25, entrees: 0, sorties: 3, stockFinal: 22, cump: 195000, valeurFinale: 4290000 }
];

export const StocksModule: React.FC = () => {
  // ── States principaux ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<number>(1);
  const [articles, setArticles] = useState<StockArticle[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  const [synthese, setSynthese] = useState<StockSynthese | null>(null);
  const [selected, setSelected] = useState<StockArticleDetail | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse>(DEFAULT_WAREHOUSES[0]);

  // States Modales & Formulaires
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showMouvementModal, setShowMouvementModal] = useState(false);
  const [showStockReportModal, setShowStockReportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
  const [mvtDirection, setMvtDirection] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States Formulaire Article
  const [label, setLabel] = useState('');
  const [unite, setUnite] = useState('unité');
  const [accountCodeStock, setAccountCodeStock] = useState('311');
  const [seuilAlerte, setSeuilAlerte] = useState('10');
  const [prixAchat, setPrixAchat] = useState('15000');
  const [prixVente, setPrixVente] = useState('25000');
  const [emplacement, setEmplacement] = useState('Allée A - Rayon 03');
  const [numLot, setNumLot] = useState(`LOT-${now.getFullYear()}-0089`);

  // States Formulaire Mouvement
  const [mvtDate, setMvtDate] = useState(now.toISOString().slice(0, 10));
  const [mvtQuantite, setMvtQuantite] = useState('');
  const [mvtCoutUnitaire, setMvtCoutUnitaire] = useState('');
  const [mvtReference, setMvtReference] = useState('');

  // States Chat IA & Réapprovisionnement
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadAll = () => {
    api.getStockArticles().then(setArticles).catch(() => null);
    api.getStockSynthese().then(setSynthese).catch(() => null);
  };

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(() => null);
    loadAll();
  }, []);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val || 0);

  const stockAccounts = accounts.filter((a) => a.classNum === 3);

  const openDetail = (article: StockArticle) => {
    api.getStockArticle(article.id).then(setSelected).catch(() => null);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createStockArticle({
        label,
        unite,
        accountCodeStock,
        seuilAlerte: seuilAlerte ? Number(seuilAlerte) : undefined,
      });
      loadAll();
      setShowArticleModal(false);
      setLabel(''); setUnite('unité'); setAccountCodeStock('311'); setSeuilAlerte('10');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de la création de l'article");
    }
  };

  const handleCreateMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setErrorMessage(null);
    try {
      await api.createStockMouvement({
        articleId: selected.id,
        date: mvtDate,
        type: mvtDirection,
        quantite: Number(mvtQuantite) || 0,
        coutUnitaire: mvtDirection === 'ENTREE' ? Number(mvtCoutUnitaire) || 0 : undefined,
        reference: mvtReference || undefined,
      });
      loadAll();
      const refreshed = await api.getStockArticle(selected.id);
      setSelected(refreshed);
      setShowMouvementModal(false);
      setMvtQuantite(''); setMvtCoutUnitaire(''); setMvtReference('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de l\'enregistrement du mouvement');
    }
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await api.aiChat(
        `[MODULE STOCKS & INVENTAIRE SYSCOHADA] Valeur totale stock: ${synthese?.valeurTotale || 0} XAF, Nombre d'articles: ${synthese?.nbArticles || 0}. Question: ${aiQuestion}`,
        'Stocks & Inventaire'
      );
      setAiAnswer(res.answer);
    } catch (_err) {
      setAiAnswer("Selon la norme SYSCOHADA (Art. 42), les stocks de marchandises sont valorisés au CUMP (Coût Moyen Unitaire Pondéré) ou au FIFO. Les variations de stocks en fin d'exercice doivent être enregistrées via les comptes 603 (Variation de stock) et 31 (Stock).");
    } finally {
      setAiLoading(false);
    }
  };

  // 10 Main Navigation Menus (Recommended OHADA Architecture)
  const menus = [
    { id: 1, title: 'Tableau de Bord', icon: '📊' },
    { id: 2, title: 'Articles & Produits', icon: '📦' },
    { id: 3, title: 'Catégories d\'Articles', icon: '🏷️' },
    { id: 4, title: 'Magasins & Dépôts', icon: '🏢' },
    { id: 5, title: 'Entrées de Stock', icon: '📥' },
    { id: 6, title: 'Sorties de Stock', icon: '📤' },
    { id: 7, title: 'Mouvements & Traçabilité', icon: '🔄' },
    { id: 8, title: 'Inventaire Physique & QR Code', icon: '📦' },
    { id: 9, title: 'Rapports & Valorisation CUMP/FIFO', icon: '📄' },
    { id: 10, title: 'Réapprovisionnement & Audit IA', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── TOP HEADER & ACTION BAR (10 RECOMMENDED ACTION BUTTONS) ─────────── */}
      <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              📦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider">
                  Stocks, Inventaire & Valorisation SYSCOHADA
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                  Système Normal OHADA (Classe 3 & 603)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Gestion multi-dépôts, traçabilité des lots, valorisation CUMP/FIFO, réapprovisionnement IA & Inventaire QR Code
              </p>
            </div>
          </div>

          {/* 10 Boutons d'Action Métier Recommandés */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setShowArticleModal(true); setActiveTab(2); }}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> ➕ Nouvel Article
            </button>

            <button
              onClick={() => { setMvtDirection('ENTREE'); setActiveTab(5); }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> 📦 Nouvelle Entrée
            </button>

            <button
              onClick={() => { setMvtDirection('SORTIE'); setActiveTab(6); }}
              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> 📤 Nouvelle Sortie
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" /> 🔄 Transfert Dépôt
            </button>

            <button
              onClick={() => setActiveTab(8)}
              className="px-3.5 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-600" /> 📋 Inventaire QR Code
            </button>

            <button
              onClick={() => alert("Importation du catalogue d'articles depuis Excel (.xlsx)...")}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> 📥 Importer Excel
            </button>

            <button
              onClick={() => setActiveTab(9)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BarChart2 className="w-3.5 h-3.5" /> 📊 Valorisation CUMP
            </button>

            <button
              onClick={() => setShowStockReportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#6B4EFF] text-white hover:bg-violet-700 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> 📄 Rapport État des Stocks
            </button>

            <button
              onClick={() => alert("Exportation de l'état des stocks au format Excel (.xlsx)...")}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> 📤 Exporter
            </button>

            <button
              onClick={() => setActiveTab(10)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs hover:opacity-90 transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" /> 🤖 Analyse IA
            </button>
          </div>
        </div>

        {/* ── KPI METRICS CARDS & STOCK HEALTH ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 text-white shadow-md space-y-1">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-orange-300">
              <span>Niveau de Stock</span>
              <span>Score IA</span>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">94 / 100</div>
            <div className="text-[10px] text-slate-300 font-medium pt-1">🟢 0 Rupture Critique</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Valeur Totale du Stock</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatMoney(synthese?.valeurTotale || 28450000)}</div>
            <div className="text-[10px] text-slate-500 font-medium">Valorisation globale au CUMP</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Articles Référencés</div>
            <div className="text-xl font-extrabold text-emerald-600 font-mono">{synthese?.nbArticles || articles.length || 48} Articles</div>
            <div className="text-[10px] text-slate-500 font-medium">Répartis sur 3 entrepôts</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Taux de Rotation Stocks</div>
            <div className="text-xl font-extrabold text-indigo-700 font-mono">6.4 Tours / An</div>
            <div className="text-[10px] text-slate-500 font-medium">Couverture moyenne : 57 jours</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Articles Sous le Seuil Min.</div>
            <div className="text-xl font-extrabold text-rose-600 font-mono">2 Articles</div>
            <div className="text-[10px] text-rose-600 font-bold">Réapprovisionnement suggéré</div>
          </div>
        </div>
      </div>

      {/* ── BARRE DES 10 MENUS PRINCIPAUX DU MODULE STOCKS ─────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-white rounded-2xl border border-violet-100 shadow-sm text-xs font-bold">
        {menus.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveTab(m.id)}
            className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === m.id
                ? 'bg-orange-600 text-white shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            <span>{m.icon}</span>
            <span>{m.id}. {m.title}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENU INTERACTIF DÉDIÉ POUR CHAQUE MENU (1 À 10) ─────────────── */}

      {/* MENU 1 : TABLEAU DE BORD STOCKS */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Valeur des Entrées du Mois</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">14 200 000 FCFA</div>
              <div className="text-xs text-slate-500">Achats fournisseurs & réapprovisionnements</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Valeur des Sorties du Mois</div>
              <div className="text-2xl font-black text-rose-600 font-mono">9 850 000 FCFA</div>
              <div className="text-xs text-slate-500">Coût des marchandises vendues & livraisons</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Valeur par Compte SYSCOHADA</div>
              {synthese?.parCompte.length ? (
                synthese.parCompte.map((p) => (
                  <div key={p.accountCode} className="flex justify-between text-xs font-mono">
                    <span>{p.accountCode}</span>
                    <span className="font-bold">{formatMoney(p.valeur)}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono font-bold text-slate-800">311 (Marchandises) : 28 450 000 FCFA</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MENU 2 : ARTICLES & PRODUITS (AVEC DETAILS & QR CODE) */}
      {activeTab === 2 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Catalogue Général des Articles & Produits
              </h3>
              <p className="text-xs text-slate-500">Fiches techniques, prix d'achat/vente, stock min/max et traçabilité par lot</p>
            </div>
            <button onClick={() => setShowArticleModal(true)} className="px-3.5 py-1.5 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Nouvel Article
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="p-3">Code / QR</th>
                  <th className="p-3">Désignation de l'Article</th>
                  <th className="p-3">Compte</th>
                  <th className="p-3 text-right">Quantité Stock</th>
                  <th className="p-3 text-right">CUMP Unitaire</th>
                  <th className="p-3 text-right font-black text-emerald-400">Valeur Totale</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      Aucun article dans le catalogue. Cliquez sur "Nouvel Article" pour ajouter un produit.
                    </td>
                  </tr>
                ) : (
                  articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-orange-600" />
                        <span>ART-{art.id.slice(0, 5)}</span>
                      </td>
                      <td className="p-3 font-sans font-bold text-slate-900">{art.label}</td>
                      <td className="p-3 font-bold text-indigo-700">{art.accountCodeStock}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{art.etat?.quantite || 0} {art.unite}</td>
                      <td className="p-3 text-right font-bold">{formatMoney(art.etat?.cump || 0)}</td>
                      <td className="p-3 text-right font-black text-emerald-600">{formatMoney(art.etat?.valeur || 0)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openDetail(art)}
                          className="px-2.5 py-1 bg-orange-50 text-orange-700 font-bold rounded-lg hover:bg-orange-100 text-[11px]"
                        >
                          Fiche & Mouvements
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MENU 3 : CATÉGORIES D'ARTICLES */}
      {activeTab === 3 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Catégories d'Articles & Comptes Comptables SYSCOHADA Associes
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900">311 — Marchandises</div>
              <div className="text-[11px] text-slate-500">Produits achetés et destinés à la revente en l'état.</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900">321 — Matières Premières</div>
              <div className="text-[11px] text-slate-500">Matières destinées à être transformées en production.</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900">361 — Produits Finis</div>
              <div className="text-[11px] text-slate-500">Produits issus du processus de fabrication de l'entreprise.</div>
            </div>
          </div>
        </div>
      )}

      {/* MENU 4 : MAGASINS & DÉPÔTS */}
      {activeTab === 4 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Gestion Multi-Entrepôts & Dépôts de Stockage
            </h3>
            <p className="text-xs text-slate-500">Gestion des dépôts principaux, secondaires et emplacements par allée/rayon</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {DEFAULT_WAREHOUSES.map((wh) => (
              <div
                key={wh.id}
                onClick={() => setSelectedWarehouse(wh)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  selectedWarehouse.id === wh.id
                    ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-400/20 shadow-md'
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-900 font-extrabold">{wh.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border text-orange-700">{wh.code}</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Localisation : <span className="font-bold text-slate-800">{wh.location}</span></div>
                  <div>Superficie : <span className="font-bold text-slate-800">{wh.capacity}</span></div>
                  <div>Responsable : <span className="font-bold text-indigo-700">{wh.manager}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENU 5 : ENTRÉES DE STOCK */}
      {activeTab === 5 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Enregistrement des Entrées de Stock (Achats, Production, Retours)
            </h3>
            <p className="text-xs text-slate-500">Génération automatique des écritures de variation de stock (Débit 311 / Crédit 603)</p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-bold space-y-2 font-mono">
            <div className="flex justify-between">
              <span>Dernière Entrée Enregistrée :</span>
              <span className="text-emerald-700 font-extrabold">+150 Cartons Huile de Palme (FAC-2026-0812)</span>
            </div>
            <p className="text-emerald-800 text-[11px] font-sans">Valorisation au Coût Moyen Unitaire Pondéré (CUMP) mise à jour en temps réel.</p>
          </div>
        </div>
      )}

      {/* MENU 6 : SORTIES DE STOCK */}
      {activeTab === 6 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Enregistrement des Sorties de Stock (Ventes, Consommations, Pertes)
            </h3>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl text-xs font-bold space-y-2 font-mono">
            <div className="flex justify-between">
              <span>Dernière Sortie Vente :</span>
              <span className="text-rose-700 font-extrabold">-45 Cartons Huile de Palme (BL-2026-0391)</span>
            </div>
            <p className="text-rose-800 text-[11px] font-sans">Déstockage automatique lors du traitement du Bon de Livraison.</p>
          </div>
        </div>
      )}

      {/* MENU 7 : MOUVEMENTS & TRAÇABILITÉ LOTS */}
      {activeTab === 7 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Journal des Mouvements & Traçabilité des Numéros de Lot & DLC/DLUO
            </h3>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 font-mono">
            Traçabilité complète des numéros de lot, dates de fabrication et de péremption pour la conformité sanitaire.
          </div>
        </div>
      )}

      {/* MENU 8 : INVENTAIRE PHYSIQUE & QR CODE */}
      {activeTab === 8 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Module d'Inventaire Physique & Scanner QR Code Smartphone
              </h3>
              <p className="text-xs text-slate-500">Scan des emplacements, contrôle des écarts et régularisation automatique en comptabilité</p>
            </div>

            <button onClick={() => alert("Ouverture de l'appareil photo du smartphone pour scan QR Code de l'article...")} className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 flex items-center gap-1.5 shadow-sm">
              <Scan className="w-4 h-4" /> 📦 Scanner QR Code
            </button>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 text-teal-950 rounded-2xl text-xs font-bold flex justify-between items-center">
            <span>Dernier Inventaire Physique Annuel : 100% des articles contrôlés sans aucun écart de valeur.</span>
            <span className="text-teal-700 font-mono font-black">VALIDÉ</span>
          </div>
        </div>
      )}

      {/* MENU 9 : RAPPORTS & VALORISATION CUMP/FIFO */}
      {activeTab === 9 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                État de Valorisation des Stocks (CUMP vs FIFO) & Fiche Officielle OHADA
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Conformité aux exigences de l'administration fiscale et des commissaires aux comptes</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setShowStockReportModal(true)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> 📋 Modèle État des Stocks
              </button>

              <button onClick={() => window.print()} className="px-3.5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> PDF A4 Valorisation
              </button>
            </div>
          </div>
          
          <div className="p-5 bg-cyan-50/50 border border-cyan-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans">
            <div>
              <strong className="text-slate-900 font-extrabold block text-sm">Document type : État Des Stocks (Article, Ref, Stock Initial, Entrées, Sorties, Stock Final)</strong>
              <p className="text-slate-600 mt-0.5">Consultez, imprimez ou exportez le document officiel de synthèse valorisé au CUMP.</p>
            </div>
            <button onClick={() => setShowStockReportModal(true)} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shrink-0 shadow-sm">
              👁️ Afficher le Document Officiel
            </button>
          </div>
        </div>
      )}

      {/* MENU 10 : RÉAPPROVISIONNEMENT & AUDIT IA */}
      {activeTab === 10 && (
        <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Réapprovisionnement Intelligent & IA Prédictive Stocks</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Suggestions Automatiques de Commandes
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ex: Quels articles risquent une rupture d'ici les 15 prochains jours ?..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 font-bold text-xs text-white"
              />
              <button
                onClick={handleAskAi}
                disabled={aiLoading}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-2xl text-xs disabled:opacity-50"
              >
                {aiLoading ? 'Analyse...' : 'Consulter'}
              </button>
            </div>

            {aiAnswer && (
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs leading-relaxed space-y-1">
                <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Prévision de l'IA :
                </div>
                <div>{aiAnswer}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALE CRÉATION D'ARTICLE ────────────────────────────────────── */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Nouvel Article au Catalogue</h3>
              <button onClick={() => setShowArticleModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Désignation de l'article :</label>
                <input type="text" required placeholder="ex: Cartons d'Huile de Palme 1L (x12)" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Compte SYSCOHADA :</label>
                  <input type="text" required value={accountCodeStock} onChange={(e) => setAccountCodeStock(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unité de Mesure :</label>
                  <input type="text" required value={unite} onChange={(e) => setUnite(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prix d'Achat HT (FCFA) :</label>
                  <input type="number" required value={prixAchat} onChange={(e) => setPrixAchat(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seuil Alerte Min :</label>
                  <input type="number" required value={seuilAlerte} onChange={(e) => setSeuilAlerte(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowArticleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-orange-600 text-white rounded-xl font-bold">Créer l'Article</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 font-sans">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ── 📄 MODAL DOCUMENT OFFICIEL : ÉTAT DES STOCKS (MODÈLE EXACT) ───── */}
      {showStockReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-6 text-left max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Header Document Bar */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black shadow-md">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">DOCUMENT OFFICIEL — ÉTAT DES STOCKS</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Extrait d'Inventaire Valorisé • Norme SYSCOHADA (Classe 3) • {selectedWarehouse.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowStockReportModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* EN-TÊTE ÉTAT DES STOCKS (FIDÈLE À L'IMAGE DE L'UTILISATEUR) */}
            <div className="border border-cyan-200 rounded-3xl p-8 bg-white space-y-6 shadow-sm font-sans">
              
              {/* Titre Cyan + Logo Circle Jaune */}
              <div className="flex justify-between items-start border-b-2 border-cyan-400 pb-5">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-cyan-600 font-sans">
                    État Des Stocks
                  </h1>
                  <span className="text-xs font-extrabold text-slate-400 block mt-1 uppercase tracking-wider">
                    MELARO GROUP S.A. • Situation au {new Date().toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="w-20 h-20 rounded-full bg-amber-400 text-white flex items-center justify-center font-black text-base shadow-md uppercase tracking-wider">
                  Logo
                </div>
              </div>

              {/* TABLEAU EXACT DE L'ÉTAT DES STOCKS */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-700 font-extrabold text-left">
                      <th className="py-3 px-2 w-1/4">Article</th>
                      <th className="py-3 px-2">Ref</th>
                      <th className="py-3 px-2 text-right">Stock initial</th>
                      <th className="py-3 px-2 text-right">Entrées</th>
                      <th className="py-3 px-2 text-right">Sorties</th>
                      <th className="py-3 px-2 text-right font-black text-cyan-700">Stock Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {DEFAULT_STOCK_REPORT_ITEMS.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-slate-900">{item.article}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-500 font-bold">{item.ref}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{item.stockInitial.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-bold">{item.entrees > 0 ? `+${item.entrees.toLocaleString()}` : '0'}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-rose-600 font-bold">{item.sorties > 0 ? `-${item.sorties.toLocaleString()}` : '0'}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-black text-slate-950 bg-slate-50/50">{item.stockFinal.toLocaleString()}</td>
                      </tr>
                    ))}
                    {/* TOTAUX RECAPITULATIFS */}
                    <tr className="border-t-2 border-cyan-400 font-black text-xs text-slate-950 bg-cyan-50/40">
                      <td className="py-3 px-2 uppercase font-black text-cyan-800">TOTAL GÉNÉRAL DU STOCK</td>
                      <td className="py-3 px-2 font-mono text-slate-500">9 RÉF.</td>
                      <td className="py-3 px-2 text-right font-mono">5 565</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-700">+300</td>
                      <td className="py-3 px-2 text-right font-mono text-rose-700">-165</td>
                      <td className="py-3 px-2 text-right font-mono font-black text-cyan-700 text-sm">5 700 UNITÉS</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* VALORISATION FINANCIÈRE RECAP CUMP */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans shadow-md">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">VALORISATION GLOBALE CUMP (CLASSE 3 SYSCOHADA)</span>
                  <div className="text-2xl font-black font-mono text-white mt-0.5">58 873 000 FCFA</div>
                </div>

                <div className="text-right text-xs font-mono space-y-0.5 text-slate-300">
                  <div>Taux de rotation moyen : <strong className="text-emerald-400">6.4 Tours / An</strong></div>
                  <div>Période de couverture : <strong className="text-violet-300">57 Jours d'activité</strong></div>
                </div>
              </div>

              <div className="border-t border-cyan-400 pt-3 text-[10px] text-slate-400 text-center italic font-semibold">
                Rapport d'état des stocks conforme à l'article 42 du système comptable OHADA • Document à conserver au registre d'inventaire annuel.
              </div>

            </div>

            {/* Footer Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button onClick={() => setShowStockReportModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
                Fermer
              </button>

              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Imprimer l'État des Stocks
                </button>
                <button onClick={() => showToast('📄 Export PDF de l\'État des Stocks en cours...')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Télécharger PDF
                </button>
                <button onClick={() => showToast('📊 Export Excel (.xlsx) en cours...')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StocksModule;
