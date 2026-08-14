import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Plus, Download, ScanLine, Loader2, Eye, Printer, X,
  Trash2, CheckCircle2, AlertCircle, Circle, FileText,
} from 'lucide-react';
import { Invoice, Customer, Supplier } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  remisePct: number;
  tvaRate: number;
}

const UNITS = ['Unité', 'm²', 'Heure', 'Jour', 'kg', 'Forfait', 'Litre', 'Tonne'];

const TVA_RATES = [
  { value: 19.25, label: '19,25 % — Standard Cameroun / CEMAC' },
  { value: 18,    label: '18 % — Standard UEMOA / SYSCOHADA' },
  { value: 16,    label: '16 % — Standard RDC / Gabon' },
  { value: 10,    label: '10 % — Taux réduit' },
  { value: 5,     label: '5 % — Produits nécessité' },
  { value: 0,     label: '0 % — Exonéré / Export' },
];

const AIR_RATES = [
  { value: 2.2,  label: "2,2 % — Précompte AIR Biens (CEMAC)" },
  { value: 5.5,  label: "5,5 % — AIR Prestations de services" },
  { value: 1.1,  label: "1,1 % — AIR Régime simplifié" },
  { value: 2,    label: "2,0 % — AIR Biens standard" },
  { value: 5,    label: "5,0 % — AIR Prestations standard" },
  { value: 10,   label: "10 % — BNC / Non immatriculés" },
  { value: 15,   label: "15 % — Loyers / Droits d'auteur" },
  { value: 0,    label: "0 % — Aucune retenue" },
];

const PAYMENT_MODES = ['Virement bancaire', 'Chèque bancaire', 'Mobile Money', 'Espèces', 'Carte bancaire', 'Autre'];
const PAYMENT_DELAYS = [
  { value: 0,  label: 'Comptant' },
  { value: 15, label: '15 jours' },
  { value: 30, label: '30 jours' },
  { value: 45, label: '45 jours' },
  { value: 60, label: '60 jours' },
  { value: 90, label: '90 jours' },
];

const DOC_TYPES = ['Facture', 'Facture pro forma', 'Avoir', "Facture d'acompte"];

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  VALIDE:    { label: 'Validée',        color: 'bg-blue-100 text-blue-700 border-blue-200' },
  EMIS:      { label: 'Émise',          color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  PARTIEL:   { label: 'Part. payée',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
  PAYE:      { label: 'Payée',          color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ANNULE:    { label: 'Annulée',        color: 'bg-red-100 text-red-700 border-red-200' },
};

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

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' FCFA';

const mkLine = (): InvoiceLine => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  unit: 'Unité',
  unitPrice: 0,
  remisePct: 0,
  tvaRate: 19.25,
});

function addDays(d: string, n: number): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().substring(0, 10);
}

export const InvoicingModule: React.FC = () => {
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [previewInv, setPreviewInv] = useState<Invoice | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [stockArticles, setStockArticles] = useState<any[]>([]);

  const [invoiceType,   setInvoiceType]   = useState<'VENTE'|'ACHAT'>('VENTE');
  const [docType,       setDocType]       = useState('Facture');
  const [tierId,        setTierId]        = useState('');
  const [invoiceDate,   setInvoiceDate]   = useState(() => new Date().toISOString().substring(0,10));
  const [paymentDelay,  setPaymentDelay]  = useState(30);
  const [dueDate,       setDueDate]       = useState(() => addDays(new Date().toISOString().substring(0,10), 30));
  const [lines,         setLines]         = useState<InvoiceLine[]>([mkLine()]);

  const [globalAirRate,   setGlobalAirRate]   = useState(2.2);
  const [globalRemisePct, setGlobalRemisePct] = useState(0);
  const [escomptePct,     setEscomptePct]     = useState(0);
  const [transportHT,     setTransportHT]     = useState(0);
  const [emballagesHT,    setEmballagesHT]    = useState(0);
  const [paymentMode,     setPaymentMode]     = useState('Virement bancaire');
  const [paymentRef,      setPaymentRef]      = useState('');
  const [isPaid,          setIsPaid]          = useState(false);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError,   setOcrError]   = useState<string|null>(null);
  const [ocrHint,    setOcrHint]    = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lineSearch, setLineSearch] = useState<Record<string,string>>({});

  const loadInvoices = useCallback(() => api.getInvoices().then(setInvoices), []);

  useEffect(() => {
    loadInvoices();
    api.getClients().then(cs => { setCustomers(cs); if (cs.length > 0) setTierId(cs[0].id); });
    api.getSuppliers().then(setSuppliers);
    api.getStockArticles().then(setStockArticles).catch(() => {});
  }, [loadInvoices]);

  useEffect(() => {
    const tiers = invoiceType === 'VENTE' ? customers : suppliers;
    if (tiers.length > 0) setTierId(tiers[0].id); else setTierId('');
  }, [invoiceType, customers, suppliers]);

  useEffect(() => { setDueDate(addDays(invoiceDate, paymentDelay)); }, [invoiceDate, paymentDelay]);

  const lineCalcs = lines.map(l => {
    const brutHT   = l.quantity * l.unitPrice;
    const remAmt   = (brutHT * l.remisePct) / 100;
    const netHT    = brutHT - remAmt;
    const tvaAmt   = (netHT * l.tvaRate)    / 100;
    return { brutHT, remAmt, netHT, tvaAmt, totalTTC: netHT + tvaAmt };
  });

  const subtotalHT    = lineCalcs.reduce((s,c) => s + c.netHT, 0);
  const remGlobalAmt  = (subtotalHT    * globalRemisePct) / 100;
  const netCommercial = subtotalHT    - remGlobalAmt;
  const escompteAmt   = (netCommercial * escomptePct)     / 100;
  const netFinancier  = netCommercial - escompteAmt;
  const accessHT      = transportHT   + emballagesHT;
  const baseTVA       = netFinancier  + accessHT;
  const totalTVA      = lineCalcs.reduce((s,c) => s + c.tvaAmt, 0);
  const totalTTC      = baseTVA       + totalTVA;
  const totalAIR      = (baseTVA      * globalAirRate)    / 100;
  const netAPayer     = totalTTC      - totalAIR;

  const hasTier    = !!tierId;
  const hasLines   = lines.some(l => l.description.trim() && l.unitPrice > 0);
  const hasDate    = !!invoiceDate;
  const hasPayment = !!paymentMode;
  const isValid    = hasTier && hasLines && hasDate && hasPayment && netAPayer > 0;

  const updLine = (id: string, f: keyof InvoiceLine, v: string|number) =>
    setLines(p => p.map(l => l.id === id ? { ...l, [f]: v } : l));

  const resetForm = () => {
    setLines([mkLine()]);
    setGlobalRemisePct(0); setEscomptePct(0);
    setTransportHT(0); setEmballagesHT(0);
    setPaymentRef(''); setIsPaid(false);
    setOcrHint(null); setErrorMsg(null);
  };

  const handleScanInvoice = async (file: File) => {
    setOcrLoading(true); setOcrError(null); setOcrHint(null);
    try {
      const b64  = await fileToBase64(file);
      const dft  = await api.aiExtractInvoice(b64, file.type);
      if (dft.lineItems?.length) {
        setLines(dft.lineItems.map(it => ({
          id: crypto.randomUUID(),
          description: it.description || '',
          quantity:    it.quantity    || 1,
          unit:        'Unité',
          unitPrice:   it.unitPrice   || 0,
          remisePct:   0,
          tvaRate:     dft.totalTVA && dft.subtotalHT ? Math.round((dft.totalTVA/dft.subtotalHT)*100) : 19.25,
        })));
      }
      if (dft.supplierName) setOcrHint(`Fournisseur détecté : "${dft.supplierName}" — sélectionnez-le ci-dessous.`);
    } catch (err) {
      setOcrError(err instanceof ApiError ? err.message : "Erreur lors de l'extraction");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const buildPayload = () => {
    const tiers = invoiceType === 'VENTE' ? customers : suppliers;
    const tier  = tiers.find(t => t.id === tierId);
    return {
      type: invoiceType, tierId,
      tierName:  tier?.name || 'DIVERS',
      date:      invoiceDate,
      dueDate,
      items: lines.map((l,i) => ({
        id: '', description: l.description || `Ligne ${i+1}`,
        quantity: l.quantity, unitPrice: l.unitPrice, unit: l.unit,
        tvaRate: l.tvaRate,
        totalHT:  lineCalcs[i].netHT,
        totalTVA: lineCalcs[i].tvaAmt,
        totalTTC: lineCalcs[i].totalTTC,
        accountCode: invoiceType === 'VENTE' ? '701' : '601',
      })),
      subtotalHT, remiseRate: globalRemisePct, remiseAmount: remGlobalAmt,
      netCommercial, escompteRate: escomptePct, escompteAmount: escompteAmt,
      netFinancier, transportHT, emballagesHT, baseTVA, totalTVA,
      airRate: globalAirRate, totalAIR, totalTTC, netAPayer,
      paymentMode, paymentReference: paymentRef,
      paymentDate: isPaid ? invoiceDate : undefined,
    };
  };

  const handleSaveDraft = async () => {
    setErrorMsg(null);
    if (!hasTier || !hasLines) { setErrorMsg('Renseignez le client/fournisseur et au moins une ligne.'); return; }
    try {
      await api.createInvoice(buildPayload() as any);
      await loadInvoices(); setShowModal(false); resetForm();
      setSuccessMsg('Brouillon enregistré avec succès.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) { setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de la création'); }
  };

  const handleEmit = async () => {
    setErrorMsg(null);
    if (!isValid) { setErrorMsg('Complétez tous les champs obligatoires avant d\'émettre.'); return; }
    try {
      const created = await api.createInvoice(buildPayload() as any);
      await api.validateInvoice(created.id);
      await loadInvoices(); setShowModal(false); resetForm();
      setSuccessMsg('Facture émise — écriture comptable générée automatiquement (Journal VE / VA).');
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) { setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors de l'émission"); }
  };

  const handleValidate = async (id: string) => {
    try {
      await api.validateInvoice(id); await loadInvoices();
      setSuccessMsg('Facture validée — écriture comptable générée.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) { setErrorMsg(err instanceof ApiError ? err.message : 'Erreur validation'); }
  };

  const handleDownloadPdf = async (inv: Invoice) => {
    try { await api.downloadInvoicePdf(inv.id, inv.invoiceNumber); }
    catch (err) { setErrorMsg(err instanceof ApiError ? err.message : 'Erreur PDF'); }
  };

  const currentTiers = invoiceType === 'VENTE' ? customers : suppliers;

  const filteredArticles = (search: string) =>
    search.trim().length < 2
      ? []
      : stockArticles.filter((a:any) => (a.name||'').toLowerCase().includes(search.toLowerCase())).slice(0,6);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Facturation & Fiscalité</h2>
          <p className="text-xs text-slate-400 mt-0.5">SYSCOHADA Révisé · TVA · Retenues AIR / BNC</p>
        </div>
        <button onClick={() => { setShowModal(true); setErrorMsg(null); }}
          disabled={customers.length === 0 && suppliers.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-md">
          <Plus className="w-4 h-4" /> Nouvelle facture
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
        </div>
      )}

      {/* Register */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registre des factures</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">N° Facture</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Tiers</th>
                <th className="px-4 py-3 text-right">Total HT</th>
                <th className="px-4 py-3 text-right">TVA</th>
                <th className="px-4 py-3 text-right">Net à Payer</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Aucune facture. Créez votre première facture.</td></tr>
              )}
              {invoices.map(inv => {
                const net = inv.netAPayer ?? ((Number(inv.totalTTC)||0) - (Number(inv.totalAIR)||0));
                const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG['BROUILLON'];
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-violet-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${inv.type==='VENTE'?'bg-emerald-100 text-emerald-700':'bg-indigo-100 text-indigo-700'}`}>{inv.type}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{inv.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.tierName}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmt(Number(inv.subtotalHT)||0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{fmt(Number(inv.totalTVA)||0)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{fmt(net)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setPreviewInv(inv)} title="Aperçu"
                          className="p-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {inv.status === 'BROUILLON' && (
                          <button onClick={() => handleValidate(inv.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-semibold">
                            Valider
                          </button>
                        )}
                        <button onClick={() => handleDownloadPdf(inv)} title="PDF"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREATION */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-6 border border-slate-200 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-violet-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nouvelle facture</h3>
                  <p className="text-[11px] text-slate-400">{docType} · {invoiceType === 'VENTE' ? 'Vente Client' : 'Achat Fournisseur'} · {new Date().getFullYear()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">Brouillon</span>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ZONE 1 : Informations */}
              <section>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Informations</div>
                <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setInvoiceType('VENTE')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${invoiceType==='VENTE'?'bg-violet-600 text-white border-violet-600':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                    Facture de vente (Client)
                  </button>
                  <button type="button" onClick={() => setInvoiceType('ACHAT')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${invoiceType==='ACHAT'?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                    Facture d'achat (Fournisseur)
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Type de document</label>
                    <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      {DOC_TYPES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{invoiceType === 'VENTE' ? 'Client' : 'Fournisseur'} <span className="text-red-500">*</span></label>
                    <select value={tierId} onChange={e => setTierId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      {currentTiers.length === 0
                        ? <option value="">Aucun {invoiceType === 'VENTE' ? 'client' : 'fournisseur'}</option>
                        : currentTiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date d'émission <span className="text-red-500">*</span></label>
                    <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Délai de paiement</label>
                    <select value={paymentDelay} onChange={e => setPaymentDelay(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      {PAYMENT_DELAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-0.5">Échéance : {dueDate}</p>
                  </div>
                </div>
                {invoiceType === 'ACHAT' && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><ScanLine className="w-3.5 h-3.5 text-indigo-500" />Scanner une facture fournisseur (extraction auto)</div>
                    <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" disabled={ocrLoading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleScanInvoice(f); }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs" />
                    {ocrLoading && <div className="flex items-center gap-2 text-[11px] text-indigo-600"><Loader2 className="w-3 h-3 animate-spin" />Extraction en cours…</div>}
                    {ocrError  && <div className="text-[11px] text-red-600">{ocrError}</div>}
                    {ocrHint   && <div className="text-[11px] text-indigo-700">{ocrHint}</div>}
                  </div>
                )}
              </section>

              {/* ZONE 2 : Articles */}
              <section>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Articles & Prestations</div>
                <div className="border border-slate-200 rounded-xl overflow-visible">
                  <div className="bg-slate-50 grid grid-cols-[1fr_56px_80px_100px_62px_70px_90px_28px] gap-x-2 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div>Désignation</div><div className="text-center">Qté</div><div>Unité</div>
                    <div className="text-right">PU HT (FCFA)</div><div className="text-right">Rem.%</div>
                    <div className="text-right">TVA%</div><div className="text-right">Total TTC</div><div/>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {lines.map((line, idx) => {
                      const calc = lineCalcs[idx];
                      const search = lineSearch[line.id] || '';
                      const suggestions = filteredArticles(search);
                      return (
                        <div key={line.id} className="px-3 py-2 bg-white hover:bg-slate-50/50">
                          <div className="grid grid-cols-[1fr_56px_80px_100px_62px_70px_90px_28px] gap-x-2 items-center">
                            <div className="relative">
                              <input type="text" value={line.description}
                                onChange={e => { updLine(line.id,'description',e.target.value); setLineSearch(p=>({...p,[line.id]:e.target.value})); }}
                                placeholder="Désignation article / prestation…"
                                className="w-full bg-transparent border border-slate-200 rounded-lg px-2 py-1.5 text-xs placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-400" />
                              {suggestions.length > 0 && (
                                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto">
                                  {suggestions.map((a:any) => (
                                    <button key={a.id} type="button"
                                      onClick={() => { updLine(line.id,'description',a.name); updLine(line.id,'unitPrice',a.prixVenteHT||a.prixUnitaire||0); updLine(line.id,'tvaRate',a.tauxTVA??19.25); updLine(line.id,'unit',a.unite||'Unité'); setLineSearch(p=>({...p,[line.id]:''})); }}
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-violet-50 border-b border-slate-50 last:border-0">
                                      <div className="font-semibold text-slate-800">{a.name}</div>
                                      <div className="text-slate-400">{a.prixVenteHT ? fmt(a.prixVenteHT) : ''} · TVA {a.tauxTVA??19.25} %</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <input type="number" min="0.01" step="0.01" value={line.quantity}
                              onChange={e => updLine(line.id,'quantity',Number(e.target.value))}
                              className="text-center bg-transparent border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-mono w-full focus:outline-none focus:ring-1 focus:ring-violet-400" />
                            <select value={line.unit} onChange={e => updLine(line.id,'unit',e.target.value)}
                              className="bg-transparent border border-slate-200 rounded-lg px-1 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-violet-400">
                              {UNITS.map(u => <option key={u}>{u}</option>)}
                            </select>
                            <input type="number" min="0" value={line.unitPrice||''}
                              onChange={e => updLine(line.id,'unitPrice',Number(e.target.value))} placeholder="0"
                              className="text-right bg-transparent border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono w-full focus:outline-none focus:ring-1 focus:ring-violet-400" />
                            <input type="number" min="0" max="100" value={line.remisePct||''}
                              onChange={e => updLine(line.id,'remisePct',Number(e.target.value))} placeholder="0"
                              className="text-right bg-transparent border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono w-full focus:outline-none focus:ring-1 focus:ring-violet-400" />
                            <select value={line.tvaRate} onChange={e => updLine(line.id,'tvaRate',Number(e.target.value))}
                              className="bg-transparent border border-slate-200 rounded-lg px-1 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-violet-400">
                              {TVA_RATES.map(r => <option key={r.value} value={r.value}>{r.value}%</option>)}
                            </select>
                            <div className="text-right text-xs font-mono font-semibold text-slate-800">{calc.totalTTC > 0 ? fmt(calc.totalTTC) : '—'}</div>
                            <button type="button" onClick={() => setLines(p => p.length > 1 ? p.filter(l => l.id !== line.id) : p)} disabled={lines.length === 1}
                              className="p-1 text-slate-300 hover:text-red-400 disabled:opacity-30">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-3 py-2.5 border-t border-slate-100 bg-slate-50">
                    <button type="button" onClick={() => setLines(p => [...p, mkLine()])}
                      className="flex items-center gap-1.5 text-[11px] text-violet-600 hover:text-violet-700 font-semibold">
                      <Plus className="w-3.5 h-3.5" />Ajouter une ligne
                    </button>
                  </div>
                </div>
              </section>

              {/* ZONE 3 : Taxes */}
              <section>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Taxes & Conditions de règlement</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Remise globale (%)</label>
                    <input type="number" min="0" max="100" value={globalRemisePct||''} onChange={e => setGlobalRemisePct(Number(e.target.value))} placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono" />
                    <p className="text-[10px] text-slate-400 mt-0.5">Sur sous-total HT</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Escompte financier (%)</label>
                    <input type="number" min="0" max="100" value={escomptePct||''} onChange={e => setEscomptePct(Number(e.target.value))} placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Transport HT (FCFA)</label>
                    <input type="number" min="0" value={transportHT||''} onChange={e => setTransportHT(Number(e.target.value))} placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Emballages / Frais (FCFA)</label>
                    <input type="number" min="0" value={emballagesHT||''} onChange={e => setEmballagesHT(Number(e.target.value))} placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Retenue fiscale / AIR / BNC</label>
                    <select value={globalAirRate} onChange={e => setGlobalAirRate(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      {AIR_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mode de paiement</label>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Référence paiement</label>
                    <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="N° chèque, virement…"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer mt-auto">
                      <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-4 h-4 rounded text-emerald-600 border-slate-300" />
                      <span className="text-[11px] font-semibold text-slate-700">Marquer comme réglée</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* ZONE 4 : Résumé + Contrôle */}
              <section>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contrôle avant émission</div>
                    <div className="space-y-1.5">
                      {[
                        { ok: hasTier,       label: invoiceType === 'VENTE' ? 'Client sélectionné' : 'Fournisseur sélectionné' },
                        { ok: hasDate,       label: "Date d'émission renseignée" },
                        { ok: hasLines,      label: 'Au moins une ligne valide' },
                        { ok: netAPayer > 0, label: 'Montant net positif' },
                        { ok: hasPayment,    label: 'Mode de règlement défini' },
                      ].map(({ ok, label }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0"/> : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0"/>}
                          <span className={ok ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
                        </div>
                      ))}
                    </div>
                    {isValid && (
                      <div className="mt-3 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                        Facture prête à être émise
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Résumé de la facture</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500"><span>Sous-total HT</span><span className="font-mono">{fmt(subtotalHT)}</span></div>
                      {remGlobalAmt > 0 && <div className="flex justify-between text-slate-500"><span>Remise ({globalRemisePct} %)</span><span className="font-mono text-emerald-600">-{fmt(remGlobalAmt)}</span></div>}
                      {escompteAmt  > 0 && <div className="flex justify-between text-slate-500"><span>Escompte ({escomptePct} %)</span><span className="font-mono text-emerald-600">-{fmt(escompteAmt)}</span></div>}
                      {accessHT     > 0 && <div className="flex justify-between text-slate-500"><span>Transport & frais</span><span className="font-mono">+{fmt(accessHT)}</span></div>}
                      <div className="flex justify-between text-slate-500"><span>Base imposable TVA</span><span className="font-mono">{fmt(baseTVA)}</span></div>
                      <div className="flex justify-between text-slate-500"><span>TVA (total)</span><span className="font-mono text-emerald-600">+{fmt(totalTVA)}</span></div>
                      <div className="flex justify-between font-semibold text-slate-700 border-t border-slate-200 pt-1.5"><span>Total TTC</span><span className="font-mono">{fmt(totalTTC)}</span></div>
                      {totalAIR > 0 && <div className="flex justify-between text-amber-600"><span>Retenue AIR / BNC ({globalAirRate} %)</span><span className="font-mono">-{fmt(totalAIR)}</span></div>}
                      <div className="flex justify-between font-black text-slate-900 border-t-2 border-slate-800 pt-2 text-sm"><span>NET À PAYER</span><span className="font-mono">{fmt(netAPayer)}</span></div>
                    </div>
                  </div>
                </div>
              </section>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0"/>{errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold">Annuler</button>
                <button type="button" onClick={handleSaveDraft}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Enregistrer brouillon</button>
                <button type="button" onClick={handleEmit} disabled={!isValid}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/30">
                  Émettre la facture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APERCU ZERVANT */}
      {previewInv && (() => {
        const subHT  = Number(previewInv.subtotalHT)||0;
        const rAmt   = previewInv.remiseAmount  || 0;
        const eAmt   = previewInv.escompteAmount || 0;
        const port   = previewInv.transportHT   || 0;
        const tva    = Number(previewInv.totalTVA)||0;
        const ttc    = Number(previewInv.totalTTC)||0;
        const air    = Number(previewInv.totalAIR)||0;
        const netPay = previewInv.netAPayer ?? (ttc - air);
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aperçu de la facture</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(previewInv)}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <Download className="w-3.5 h-3.5"/>Télécharger PDF
                  </button>
                  <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-all">
                    <Printer className="w-3.5 h-3.5"/>Imprimer A4
                  </button>
                  <button onClick={() => setPreviewInv(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="p-10 space-y-8 bg-white text-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-black text-[#00a8c6] tracking-tight">Facture n° {previewInv.invoiceNumber.replace('FAC-','')}</h1>
                    {previewInv.status === 'PAYE' && (
                      <div className="mt-2 text-xs text-[#00a8c6] font-semibold flex items-center gap-4">
                        <span>Acquittée le {previewInv.paymentDate||previewInv.date} · {previewInv.paymentMode||'Virement'}{previewInv.paymentReference ? ` n°${previewInv.paymentReference}` : ''}</span>
                        <span className="italic text-slate-400 border-b border-slate-300 pb-0.5 min-w-[100px] text-center text-[10px]">Signature :</span>
                      </div>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-sm shadow-md">LOGO</div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-0.5 text-xs text-slate-500">
                    <div className="font-bold text-slate-900 text-sm mb-1">MELARO GROUP</div>
                    <div>22, Avenue De La Liberté, Douala</div>
                    <div>NIU : M082612345678A · RCCM : CM-DOU-2026-B-14529</div>
                    <div>Tél : +237 6 99 00 00 00</div>
                  </div>
                  <div className="space-y-0.5 text-xs text-slate-500">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Destinataire</div>
                    <div className="font-bold text-slate-900 text-sm">{previewInv.tierName}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 py-4 border-y border-slate-100 text-xs">
                  {[['Date',previewInv.date],['Échéance',previewInv.dueDate],['Règlement',previewInv.paymentMode||'—'],['Référence',previewInv.paymentReference||'—']].map(([k,v]) => (
                    <div key={k}><div className="text-[10px] text-slate-400">{k}</div><div className="font-semibold text-slate-800">{v}</div></div>
                  ))}
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2 text-left">Désignation</th>
                      <th className="py-2 text-center">Qté</th>
                      <th className="py-2 text-center">Unité</th>
                      <th className="py-2 text-right">PU HT</th>
                      <th className="py-2 text-right">TVA %</th>
                      <th className="py-2 text-right font-black">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(previewInv.items?.length ? previewInv.items : [{description:'Prestation',quantity:1,unit:'u',unitPrice:subHT,tvaRate:18,totalTTC:ttc} as any]).map((item:any,i:number) => (
                      <tr key={i}>
                        <td className="py-2.5 font-medium text-slate-800">{item.description}</td>
                        <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="py-2.5 text-center text-slate-500">{item.unit||'u'}</td>
                        <td className="py-2.5 text-right font-mono">{fmt(item.unitPrice)}</td>
                        <td className="py-2.5 text-right font-mono">{item.tvaRate} %</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">{fmt(item.totalTTC||0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-500"><span>Sous-total HT</span><span>{fmt(subHT)}</span></div>
                    {rAmt > 0 && <div className="flex justify-between text-emerald-600"><span>Remise</span><span>-{fmt(rAmt)}</span></div>}
                    {eAmt > 0 && <div className="flex justify-between text-emerald-600"><span>Escompte</span><span>-{fmt(eAmt)}</span></div>}
                    {port > 0 && <div className="flex justify-between text-indigo-600"><span>Transport</span><span>+{fmt(port)}</span></div>}
                    <div className="flex justify-between text-slate-500"><span>TVA</span><span className="text-emerald-600">+{fmt(tva)}</span></div>
                    <div className="flex justify-between font-semibold text-slate-700 border-t border-slate-200 pt-1"><span>Total TTC</span><span>{fmt(ttc)}</span></div>
                    {air > 0 && <div className="flex justify-between text-amber-600"><span>Retenue AIR ({previewInv.airRate} %)</span><span>-{fmt(air)}</span></div>}
                    <div className="flex justify-between font-black text-[#00a8c6] text-sm border-t-2 border-[#00a8c6] pt-2"><span>NET À PAYER</span><span>{fmt(netPay)}</span></div>
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-[10px] text-slate-400">
                  <div><div className="font-bold text-slate-700 mb-1">Siège social</div><div>22, Avenue De La Liberté</div><div>Douala, Cameroun</div></div>
                  <div><div className="font-bold text-slate-700 mb-1">Coordonnées</div><div>Tél : +237 6 99 00 00 00</div><div>Email : contact@melarogroup.cm</div></div>
                  <div><div className="font-bold text-slate-700 mb-1">Coordonnées bancaires</div><div>Banque : BGFIBank Cameroun</div><div>IBAN : CM21-10005-12345678-90</div></div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
