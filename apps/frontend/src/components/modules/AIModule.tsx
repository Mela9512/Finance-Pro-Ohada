import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, ScanLine, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { ExtractedInvoiceDraft, AnomalyReport, CashflowForecast } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.substring(result.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const AIModule: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [forecast, setForecast] = useState<CashflowForecast | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [anomalyReport, setAnomalyReport] = useState<AnomalyReport | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);

  const [ocrDraft, setOcrDraft] = useState<ExtractedInvoiceDraft | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.aiGetCashflowForecast().then(setForecast).catch((err) => {
      setForecastError(err instanceof ApiError ? err.message : 'Erreur lors du chargement de la prévision');
    });
  }, []);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || chatLoading) return;
    const q = question.trim();
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setChatError(null);
    setChatLoading(true);
    try {
      const { answer } = await api.aiChat(q);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setChatError(err instanceof ApiError ? err.message : "Erreur lors de l'appel à l'assistant IA");
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnalyzeAnomalies = async () => {
    setAnomalyLoading(true);
    setAnomalyError(null);
    try {
      setAnomalyReport(await api.aiGetAnomalies());
    } catch (err) {
      setAnomalyError(err instanceof ApiError ? err.message : "Erreur lors de la détection d'anomalies");
    } finally {
      setAnomalyLoading(false);
    }
  };

  const handleScanInvoice = async (file: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrDraft(null);
    try {
      const base64 = await fileToBase64(file);
      const draft = await api.aiExtractInvoice(base64, file.type);
      setOcrDraft(draft);
    } catch (err) {
      setOcrError(err instanceof ApiError ? err.message : "Erreur lors de l'extraction de la facture");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 bg-[#f4f7fc] min-h-screen p-4 sm:p-6 text-slate-900 rounded-2xl">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" /> Assistant IA (Gemini)
        </h2>
        <div className="text-xs text-slate-500 font-medium mt-1">
          Toutes les réponses et prévisions s'appuient uniquement sur les données réelles de votre comptabilité —
          jamais de chiffres inventés. Les extractions de factures ne sont jamais enregistrées automatiquement.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 space-y-4 flex flex-col h-[480px]">
          <h3 className="text-sm font-bold text-white">Assistant Conversationnel</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && (
              <div className="text-xs text-slate-500 italic">
                Posez une question sur votre Bilan, votre Compte de Résultat ou vos écarts budgétaires...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-xs rounded-lg p-3 max-w-[90%] ${m.role === 'user' ? 'ml-auto bg-[#0f2d5e] text-white' : 'bg-slate-800 text-slate-100'}`}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Réflexion en cours...
              </div>
            )}
          </div>
          {chatError && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{chatError}</div>}
          <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Quel est mon résultat net actuel ?"
              className="flex-1 glass-input rounded-lg px-3 py-2 text-xs"
            />
            <button type="submit" disabled={chatLoading} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Prévision de Trésorerie (30/60/90 jours)
            </h3>
            {forecastError && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{forecastError}</div>}
            {!forecast && !forecastError && <div className="text-xs text-slate-400 italic">Chargement...</div>}
            {forecast && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">Solde de trésorerie actuel : <span className="text-white font-bold font-mono">{formatMoney(forecast.soldeActuel)}</span></div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  {[{ label: '30j', h: forecast.horizon30 }, { label: '60j', h: forecast.horizon60 }, { label: '90j', h: forecast.horizon90 }].map((x) => (
                    <div key={x.label} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1">
                      <div className="text-slate-400 font-bold">{x.label}</div>
                      <div className="text-emerald-400">+{formatMoney(x.h.entrees)}</div>
                      <div className="text-rose-400">-{formatMoney(x.h.sorties)}</div>
                      <div className="text-white font-bold border-t border-slate-800 pt-1">{formatMoney(x.h.soldeProjete)}</div>
                    </div>
                  ))}
                </div>
                {forecast.analyseIA && <div className="text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-900 rounded-lg p-3">{forecast.analyseIA}</div>}
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Détection d'Anomalies
              </h3>
              <button
                onClick={handleAnalyzeAnomalies}
                disabled={anomalyLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold"
              >
                {anomalyLoading ? 'Analyse...' : 'Analyser'}
              </button>
            </div>
            {anomalyError && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{anomalyError}</div>}
            {anomalyReport && anomalyReport.anomalies.length === 0 && (
              <div className="text-xs text-emerald-400">Aucune anomalie détectée.</div>
            )}
            {anomalyReport && anomalyReport.anomalies.length > 0 && (
              <div className="space-y-2">
                {anomalyReport.anomalies.map((a, i) => (
                  <div key={i} className={`text-xs rounded-lg p-2.5 border ${a.severity === 'HIGH' ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-amber-950/60 border-amber-800 text-amber-300'}`}>
                    {a.message}
                  </div>
                ))}
                {anomalyReport.analyseIA && <div className="text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-900 rounded-lg p-3">{anomalyReport.analyseIA}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-indigo-400" /> Scanner une Facture (OCR IA)
        </h3>
        <p className="text-[11px] text-slate-400">
          Uploadez une image ou un PDF de facture fournisseur : l'IA en extrait les montants pour vous faire gagner du
          temps de saisie. Rien n'est enregistré automatiquement — vérifiez les champs puis saisissez-les manuellement
          dans Facturation ou Comptabilité.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          disabled={ocrLoading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleScanInvoice(file);
          }}
          className="w-full glass-input rounded-lg px-3 py-2 text-xs"
        />
        {ocrLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extraction en cours...
          </div>
        )}
        {ocrError && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{ocrError}</div>}
        {ocrDraft && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between"><span className="text-slate-400">Fournisseur</span><span className="text-white font-bold">{ocrDraft.supplierName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Date facture</span><span className="text-white">{ocrDraft.invoiceDate || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Échéance</span><span className="text-white">{ocrDraft.dueDate || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Total HT</span><span className="text-white">{formatMoney(ocrDraft.subtotalHT)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">TVA</span><span className="text-emerald-400">{formatMoney(ocrDraft.totalTVA)}</span></div>
            <div className="flex justify-between font-bold border-t border-slate-800 pt-2"><span className="text-slate-300">Total TTC</span><span className="text-white">{formatMoney(ocrDraft.totalTTC)}</span></div>
            {ocrDraft.lineItems?.length > 0 && (
              <div className="pt-2 space-y-1">
                <div className="text-slate-400 uppercase text-[10px] tracking-wider">Lignes détectées</div>
                {ocrDraft.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-slate-300">
                    <span>{item.description} (x{item.quantity})</span>
                    <span>{formatMoney(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
