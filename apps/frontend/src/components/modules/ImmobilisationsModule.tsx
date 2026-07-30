import React, { useEffect, useState } from 'react';
import { Building2, Plus, FileClock, X } from 'lucide-react';
import { AccountSYSCOHADA, Immobilisation, ImmobilisationSynthese } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const now = new Date();

export const ImmobilisationsModule: React.FC = () => {
  const [items, setItems] = useState<Immobilisation[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [synthese, setSynthese] = useState<ImmobilisationSynthese | null>(null);
  const [selected, setSelected] = useState<Immobilisation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cessionTarget, setCessionTarget] = useState<Immobilisation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dotationMessage, setDotationMessage] = useState<string | null>(null);
  const [dotationLoading, setDotationLoading] = useState(false);

  const [label, setLabel] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [dateAcquisition, setDateAcquisition] = useState('');
  const [dateMiseEnService, setDateMiseEnService] = useState('');
  const [valeurAcquisitionHT, setValeurAcquisitionHT] = useState('');
  const [valeurResiduelle, setValeurResiduelle] = useState('0');
  const [dureeAmortissementAns, setDureeAmortissementAns] = useState('5');

  const [dateCession, setDateCession] = useState('');
  const [valeurCession, setValeurCession] = useState('');

  const loadAll = () => {
    api.getImmobilisations().then(setItems);
    api.getImmobilisationsSynthese(year).then(setSynthese);
  };

  useEffect(() => {
    api.getAccounts().then(setAccounts);
  }, []);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const immobilisationsAccounts = accounts.filter((a) => a.classNum === 2 && a.type === 'debit');

  const currentVNC = (item: Immobilisation): number => {
    const rowsUpToYear = item.schedule.filter((r) => r.year <= year);
    if (rowsUpToYear.length === 0) return item.valeurAcquisitionHT;
    return rowsUpToYear[rowsUpToYear.length - 1].valeurNetteComptable;
  };

  const resetForm = () => {
    setLabel(''); setAccountCode(''); setDateAcquisition(''); setDateMiseEnService('');
    setValeurAcquisitionHT(''); setValeurResiduelle('0'); setDureeAmortissementAns('5');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createImmobilisation({
        label,
        accountCode,
        dateAcquisition,
        dateMiseEnService,
        valeurAcquisitionHT: Number(valeurAcquisitionHT) || 0,
        valeurResiduelle: Number(valeurResiduelle) || 0,
        dureeAmortissementAns: Number(dureeAmortissementAns) || 1,
      });
      loadAll();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de la création de l'immobilisation");
    }
  };

  const handleCession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cessionTarget) return;
    setErrorMessage(null);
    try {
      await api.cederImmobilisation(cessionTarget.id, { dateCession, valeurCession: Number(valeurCession) || 0 });
      loadAll();
      setCessionTarget(null);
      setSelected(null);
      setDateCession(''); setValeurCession('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la cession');
    }
  };

  const handleGenererDotation = async () => {
    setDotationLoading(true);
    setDotationMessage(null);
    try {
      const res = await api.genererDotationImmobilisations(year);
      setDotationMessage(
        `Écriture générée : ${formatMoney(res.totalDotation)} sur ${res.nbImmobilisations} immobilisation${res.nbImmobilisations > 1 ? 's' : ''}.`,
      );
      loadAll();
    } catch (err) {
      setDotationMessage(err instanceof ApiError ? err.message : 'Erreur lors de la génération de l\'écriture');
    } finally {
      setDotationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060]">Immobilisations &amp; Amortissements</h2>
            <div className="text-xs text-slate-500 font-medium mt-1">Registre des actifs et amortissement linéaire prorata temporis (SYSCOHADA)</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="glass-input rounded-lg px-3 py-2 text-xs">
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#6B4EFF] hover:bg-[#5538E0] text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle immobilisation</span>
          </button>
        </div>
      </div>

      {synthese && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#EDE9FE] shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valeur brute</div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">{formatMoney(synthese.valeurBrute)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EDE9FE] shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dotation {year}</div>
            <div className="text-sm font-extrabold text-rose-600 mt-1">{formatMoney(synthese.dotationExercice)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EDE9FE] shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cumul amortissements</div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">{formatMoney(synthese.cumulAmortissements)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EDE9FE] shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valeur nette comptable</div>
            <div className="text-sm font-extrabold text-emerald-600 mt-1">{formatMoney(synthese.valeurNetteComptable)}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-[#EDE9FE] shadow-sm">
        <FileClock className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-600 font-medium flex-1">
          Génère l'écriture de dotation aux amortissements (681 / 284) pour l'exercice {year}, pour toutes les immobilisations actives non encore traitées.
        </span>
        <button
          onClick={handleGenererDotation}
          disabled={dotationLoading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
        >
          {dotationLoading ? 'Génération...' : `Générer la dotation ${year}`}
        </button>
      </div>
      {dotationMessage && <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-lg p-3">{dotationMessage}</div>}

      {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

      <div className="bg-white rounded-xl border border-[#EDE9FE] shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Libellé</th>
              <th className="px-4 py-3">Compte</th>
              <th className="px-4 py-3">Mise en service</th>
              <th className="px-4 py-3 text-right">Valeur acquisition</th>
              <th className="px-4 py-3 text-right">VNC {year}</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">Aucune immobilisation enregistrée.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer" onClick={() => setSelected(item)}>
                <td className="px-4 py-3 font-mono text-slate-500">{item.code}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{item.label}</td>
                <td className="px-4 py-3 text-slate-500 font-mono">{item.accountCode}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(item.dateMiseEnService).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{formatMoney(item.valeurAcquisitionHT)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatMoney(currentVNC(item))}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${
                    item.status === 'EN_SERVICE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.status === 'EN_SERVICE' ? 'En service' : item.status === 'CEDE' ? 'Cédée' : 'Réformée'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {item.status === 'EN_SERVICE' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCessionTarget(item); }}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Céder
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1E1060]">{selected.label} — {selected.code}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-xs text-slate-500">
              Compte {selected.accountCode} · Acquis le {new Date(selected.dateAcquisition).toLocaleDateString('fr-FR')} ·
              Mis en service le {new Date(selected.dateMiseEnService).toLocaleDateString('fr-FR')} · Durée {selected.dureeAmortissementAns} ans
            </div>
            {selected.status === 'CEDE' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                Cédée le {selected.dateCession ? new Date(selected.dateCession).toLocaleDateString('fr-FR') : '—'} pour {selected.valeurCession !== undefined ? formatMoney(selected.valeurCession) : '—'}
              </div>
            )}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-2 pr-4">Exercice</th>
                  <th className="py-2 pr-4 text-right">Dotation</th>
                  <th className="py-2 pr-4 text-right">Cumul amortissements</th>
                  <th className="py-2 text-right">Valeur nette comptable</th>
                </tr>
              </thead>
              <tbody>
                {selected.schedule.map((row) => (
                  <tr key={row.year} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-bold text-slate-700">{row.year}</td>
                    <td className="py-2 pr-4 text-right font-mono">{formatMoney(row.dotation)}</td>
                    <td className="py-2 pr-4 text-right font-mono">{formatMoney(row.cumulAmortissements)}</td>
                    <td className="py-2 text-right font-mono font-bold">{formatMoney(row.valeurNetteComptable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cessionTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Céder « {cessionTarget.label} »</h3>
            <form onSubmit={handleCession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date de cession</label>
                <input type="date" value={dateCession} onChange={(e) => setDateCession(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Valeur de cession (XAF)</label>
                <input type="number" value={valeurCession} onChange={(e) => setValeurCession(e.target.value)} required min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setCessionTarget(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold">Confirmer la cession</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800">Nouvelle immobilisation</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Libellé</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" placeholder="Ex: Véhicule de livraison Toyota Hilux" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Compte SYSCOHADA (classe 2)</label>
                <select value={accountCode} onChange={(e) => setAccountCode(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono">
                  <option value="">— Sélectionner —</option>
                  {immobilisationsAccounts.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date d'acquisition</label>
                  <input type="date" value={dateAcquisition} onChange={(e) => setDateAcquisition(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date de mise en service</label>
                  <input type="date" value={dateMiseEnService} onChange={(e) => setDateMiseEnService(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Valeur d'acquisition HT (XAF)</label>
                  <input type="number" value={valeurAcquisitionHT} onChange={(e) => setValeurAcquisitionHT(e.target.value)} required min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Valeur résiduelle (XAF)</label>
                  <input type="number" value={valeurResiduelle} onChange={(e) => setValeurResiduelle(e.target.value)} min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Durée d'amortissement (années)</label>
                <input type="number" value={dureeAmortissementAns} onChange={(e) => setDureeAmortissementAns(e.target.value)} required min="1" max="50" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
              </div>

              {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImmobilisationsModule;
