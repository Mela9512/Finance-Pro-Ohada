import React, { useEffect, useState } from 'react';
import { Users, Plus, Settings2, FileCheck, Info, Trash2 } from 'lucide-react';
import { Employee, BulletinPaie, PayrollTaxBracket, PayrollContribution, PAYROLL_TEMPLATES } from '@financepro/shared';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const PaieModule: React.FC = () => {
  const { company, refreshCompany } = useAuth();
  const [tab, setTab] = useState<'employes' | 'bulletins' | 'parametres'>('employes');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bulletins, setBulletins] = useState<BulletinPaie[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [nom, setNom] = useState('');
  const [poste, setPoste] = useState('');
  const [dateEmbauche, setDateEmbauche] = useState('');
  const [salaireBase, setSalaireBase] = useState('');
  const [numeroCNSS, setNumeroCNSS] = useState('');

  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [bulletinEmployeeId, setBulletinEmployeeId] = useState('');
  const now = new Date();
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [primesImposables, setPrimesImposables] = useState('0');
  const [primesNonImposables, setPrimesNonImposables] = useState('0');

  const [smig, setSmig] = useState(String(company?.payrollSmig ?? ''));
  const [taxBrackets, setTaxBrackets] = useState<PayrollTaxBracket[]>(company?.payrollTaxBrackets ?? []);
  const [employeeContribs, setEmployeeContribs] = useState<PayrollContribution[]>(company?.payrollEmployeeContributions ?? []);
  const [employerContribs, setEmployerContribs] = useState<PayrollContribution[]>(company?.payrollEmployerContributions ?? []);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadAll = () => {
    api.getEmployees().then(setEmployees);
    api.getBulletins().then(setBulletins);
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    setSmig(String(company?.payrollSmig ?? ''));
    setTaxBrackets(company?.payrollTaxBrackets ?? []);
    setEmployeeContribs(company?.payrollEmployeeContributions ?? []);
    setEmployerContribs(company?.payrollEmployerContributions ?? []);
  }, [company]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const settingsConfigured = !!(company?.payrollTaxBrackets?.length && company?.payrollEmployeeContributions && company?.payrollEmployerContributions);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createEmployee({ nom, poste, dateEmbauche, salaireBase: Number(salaireBase) || 0, numeroCNSS: numeroCNSS || undefined });
      loadAll();
      setShowEmployeeModal(false);
      setNom(''); setPoste(''); setDateEmbauche(''); setSalaireBase(''); setNumeroCNSS('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de la création de l'employé");
    }
  };

  const handleCreateBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinEmployeeId) return;
    setErrorMessage(null);
    try {
      await api.createBulletin({
        employeeId: bulletinEmployeeId,
        periodYear,
        periodMonth,
        primesImposables: Number(primesImposables) || 0,
        primesNonImposables: Number(primesNonImposables) || 0,
      });
      loadAll();
      setShowBulletinModal(false);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la génération du bulletin');
    }
  };

  const handleValider = async (id: string) => {
    try { await api.validerBulletin(id); loadAll(); }
    catch (err) { setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la validation'); }
  };

  const applyTemplate = (key: string) => {
    const tpl = PAYROLL_TEMPLATES[key];
    if (!tpl) return;
    setSmig(String(tpl.smig));
    setTaxBrackets(tpl.taxBrackets);
    setEmployeeContribs(tpl.employeeContributions);
    setEmployerContribs(tpl.employerContributions);
    setSettingsSaved(false);
  };

  const handleSaveSettings = async () => {
    setErrorMessage(null);
    try {
      await api.updateCompany({
        payrollSmig: Number(smig) || undefined,
        payrollTaxBrackets: taxBrackets,
        payrollEmployeeContributions: employeeContribs,
        payrollEmployerContributions: employerContribs,
      });
      await refreshCompany();
      setSettingsSaved(true);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement des paramètres");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060]">Paie</h2>
            <div className="text-xs text-slate-500 font-medium mt-1">Bulletins calculés depuis vos propres taux — aucun barème imposé par défaut</div>
          </div>
        </div>
      </div>

      {!settingsConfigured && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Configurez d'abord vos taux de cotisations et vos tranches d'impôt dans l'onglet « Paramètres » avant de pouvoir générer un bulletin.
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-[#EDE9FE] shadow-sm">
        {(['employes', 'bulletins', 'parametres'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-[#6B4EFF] text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {t === 'employes' ? 'Employés' : t === 'bulletins' ? 'Bulletins' : 'Paramètres de paie'}
          </button>
        ))}
      </div>

      {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

      {tab === 'employes' && (
        <div className="bg-white rounded-xl border border-[#EDE9FE] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EDE9FE] flex items-center justify-between">
            <span className="text-sm font-bold text-[#1E1060]">Registre du personnel</span>
            <button onClick={() => setShowEmployeeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#6B4EFF] hover:bg-[#5538E0] text-white rounded-xl text-xs font-bold">
              <Plus className="w-4 h-4" /> Nouvel employé
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Poste</th>
                <th className="px-4 py-3">Embauche</th>
                <th className="px-4 py-3 text-right">Salaire de base</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">Aucun employé enregistré.</td></tr>
              )}
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-slate-500">{e.matricule}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{e.nom}</td>
                  <td className="px-4 py-3 text-slate-600">{e.poste}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(e.dateEmbauche).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatMoney(e.salaireBase)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${e.statut === 'ACTIF' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{e.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bulletins' && (
        <div className="bg-white rounded-xl border border-[#EDE9FE] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EDE9FE] flex items-center justify-between">
            <span className="text-sm font-bold text-[#1E1060]">Bulletins de paie</span>
            <button
              onClick={() => setShowBulletinModal(true)}
              disabled={!settingsConfigured || employees.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#6B4EFF] hover:bg-[#5538E0] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Générer un bulletin
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3 text-right">Brut</th>
                <th className="px-4 py-3 text-right">Cotisations sal.</th>
                <th className="px-4 py-3 text-right">IRPP</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bulletins.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">Aucun bulletin généré.</td></tr>
              )}
              {bulletins.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-800">{b.employeeName}</td>
                  <td className="px-4 py-3 text-slate-500">{MONTHS_FR[b.periodMonth - 1]} {b.periodYear}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatMoney(b.brut)}</td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600">-{formatMoney(b.totalCotisationsSalariales)}</td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600">-{formatMoney(b.irpp)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatMoney(b.net)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${b.status === 'VALIDE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {b.status === 'VALIDE' ? 'Validé' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.status === 'BROUILLON' && (
                      <button onClick={() => handleValider(b.id)} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline ml-auto">
                        <FileCheck className="w-3 h-3" /> Valider
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'parametres' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-[#EDE9FE] shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-[#1E1060]">Paramètres de paie de l'entreprise</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Charger un modèle indicatif :</span>
                {Object.entries(PAYROLL_TEMPLATES).map(([key, tpl]) => (
                  <button key={key} onClick={() => applyTemplate(key)} className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[11px] font-bold">
                    {tpl.countryLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Les modèles pré-remplis sont indicatifs et approximatifs — vérifiez et ajustez chaque taux avec votre expert-comptable ou la CNSS/CNPS locale avant la première paie réelle.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">SMIG (salaire minimum, XAF — informatif)</label>
              <input type="number" value={smig} onChange={(e) => { setSmig(e.target.value); setSettingsSaved(false); }} className="w-full max-w-xs glass-input rounded-lg px-3 py-2 text-xs font-mono" />
            </div>

            <BracketsEditor
              title="Tranches d'imposition (IRPP / IUTS)"
              brackets={taxBrackets}
              onChange={(v) => { setTaxBrackets(v); setSettingsSaved(false); }}
            />

            <ContributionsEditor
              title="Cotisations salariales (retenues sur le salaire)"
              items={employeeContribs}
              onChange={(v) => { setEmployeeContribs(v); setSettingsSaved(false); }}
            />

            <ContributionsEditor
              title="Cotisations patronales (à la charge de l'entreprise)"
              items={employerContribs}
              onChange={(v) => { setEmployerContribs(v); setSettingsSaved(false); }}
            />

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSaveSettings} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                Enregistrer les paramètres
              </button>
              {settingsSaved && <span className="text-xs text-emerald-600 font-bold">Paramètres enregistrés ✓</span>}
            </div>
          </div>
        </div>
      )}

      {showEmployeeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Nouvel employé</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nom complet</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Poste</label>
                <input type="text" value={poste} onChange={(e) => setPoste(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date d'embauche</label>
                  <input type="date" value={dateEmbauche} onChange={(e) => setDateEmbauche(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Salaire de base (XAF)</label>
                  <input type="number" value={salaireBase} onChange={(e) => setSalaireBase(e.target.value)} required min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">N° CNSS/CNPS (optionnel)</label>
                <input type="text" value={numeroCNSS} onChange={(e) => setNumeroCNSS(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
              </div>
              {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulletinModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Générer un bulletin de paie</h3>
            <form onSubmit={handleCreateBulletin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Employé</label>
                <select value={bulletinEmployeeId} onChange={(e) => setBulletinEmployeeId(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                  <option value="">— Sélectionner —</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.nom} ({e.matricule})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mois</label>
                  <select value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))} className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                    {MONTHS_FR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Année</label>
                  <select value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Primes imposables (XAF)</label>
                  <input type="number" value={primesImposables} onChange={(e) => setPrimesImposables(e.target.value)} min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Primes non imposables (XAF)</label>
                  <input type="number" value={primesNonImposables} onChange={(e) => setPrimesNonImposables(e.target.value)} min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowBulletinModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Annuler</button>
                <button type="submit" disabled={!bulletinEmployeeId} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold">Générer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BracketsEditor: React.FC<{ title: string; brackets: PayrollTaxBracket[]; onChange: (v: PayrollTaxBracket[]) => void }> = ({ title, brackets, onChange }) => {
  const update = (i: number, field: keyof PayrollTaxBracket, value: string) => {
    const copy = brackets.map((b) => ({ ...b }));
    if (field === 'max') copy[i].max = value === '' ? null : Number(value);
    else copy[i][field] = Number(value) as never;
    onChange(copy);
  };
  const remove = (i: number) => onChange(brackets.filter((_, idx) => idx !== i));
  const add = () => onChange([...brackets, { min: 0, max: null, rate: 0 }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600">{title}</span>
        <button type="button" onClick={add} className="text-[11px] font-bold text-violet-600 hover:underline">+ Ajouter une tranche</button>
      </div>
      <div className="space-y-2">
        {brackets.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="number" value={b.min} onChange={(e) => update(i, 'min', e.target.value)} placeholder="Min" className="w-24 glass-input rounded-lg px-2 py-1.5 text-xs font-mono" />
            <span className="text-slate-400 text-xs">à</span>
            <input type="number" value={b.max ?? ''} onChange={(e) => update(i, 'max', e.target.value)} placeholder="Max (vide = illimité)" className="w-32 glass-input rounded-lg px-2 py-1.5 text-xs font-mono" />
            <span className="text-slate-400 text-xs">taux</span>
            <input type="number" value={b.rate} onChange={(e) => update(i, 'rate', e.target.value)} placeholder="%" className="w-20 glass-input rounded-lg px-2 py-1.5 text-xs font-mono" />
            <span className="text-slate-400 text-xs">%</span>
            <button type="button" onClick={() => remove(i)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {brackets.length === 0 && <div className="text-[11px] text-slate-400 italic">Aucune tranche définie.</div>}
      </div>
    </div>
  );
};

const ContributionsEditor: React.FC<{ title: string; items: PayrollContribution[]; onChange: (v: PayrollContribution[]) => void }> = ({ title, items, onChange }) => {
  const update = (i: number, field: keyof PayrollContribution, value: string) => {
    const copy = items.map((c) => ({ ...c }));
    if (field === 'label') copy[i].label = value;
    else if (field === 'ceiling') copy[i].ceiling = value === '' ? undefined : Number(value);
    else copy[i].rate = Number(value);
    onChange(copy);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { label: '', rate: 0 }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600">{title}</span>
        <button type="button" onClick={add} className="text-[11px] font-bold text-violet-600 hover:underline">+ Ajouter une cotisation</button>
      </div>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="text" value={c.label} onChange={(e) => update(i, 'label', e.target.value)} placeholder="Libellé (ex: CNSS)" className="flex-1 glass-input rounded-lg px-2 py-1.5 text-xs" />
            <input type="number" value={c.rate} onChange={(e) => update(i, 'rate', e.target.value)} placeholder="Taux %" className="w-20 glass-input rounded-lg px-2 py-1.5 text-xs font-mono" />
            <span className="text-slate-400 text-xs">%</span>
            <input type="number" value={c.ceiling ?? ''} onChange={(e) => update(i, 'ceiling', e.target.value)} placeholder="Plafond (optionnel)" className="w-36 glass-input rounded-lg px-2 py-1.5 text-xs font-mono" />
            <button type="button" onClick={() => remove(i)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {items.length === 0 && <div className="text-[11px] text-slate-400 italic">Aucune cotisation définie.</div>}
      </div>
    </div>
  );
};

export default PaieModule;
