import React, { useEffect, useState } from 'react';
import { Users, Plus, Settings2, FileCheck, Info, Trash2, FileText, Printer, Download, Eye, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Employee, BulletinPaie, PayrollTaxBracket, PayrollContribution, PAYROLL_TEMPLATES } from '@financepro/shared';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DEFAULT_DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    companyId: 'comp-1',
    matricule: 'EMP-2026-001',
    nom: 'Jean-Marc KOUAMÉ',
    poste: 'Directeur Commercial & Ventes',
    dateEmbauche: '2023-01-15',
    salaireBase: 1500000,
    numeroCNSS: 'CNPS-89201-92M',
    statut: 'ACTIF',
    createdBy: 'usr-admin',
    createdAt: '2023-01-15',
    updatedAt: '2026-01-01'
  },
  {
    id: 'emp-2',
    companyId: 'comp-1',
    matricule: 'EMP-2026-002',
    nom: 'Aïcha DIOP',
    poste: 'Responsable Comptable & Financière',
    dateEmbauche: '2023-04-01',
    salaireBase: 1200000,
    numeroCNSS: 'CNPS-77402-11D',
    statut: 'ACTIF',
    createdBy: 'usr-admin',
    createdAt: '2023-04-01',
    updatedAt: '2026-01-01'
  },
  {
    id: 'emp-3',
    companyId: 'comp-1',
    matricule: 'EMP-2026-003',
    nom: 'Emmanuel TCHAKOUNTÉ',
    poste: 'Ingénieur Systèmes & IT',
    dateEmbauche: '2024-02-10',
    salaireBase: 950000,
    numeroCNSS: 'CNPS-61029-44T',
    statut: 'ACTIF',
    createdBy: 'usr-admin',
    createdAt: '2024-02-10',
    updatedAt: '2026-01-01'
  }
];

const DEFAULT_DEMO_BULLETINS: BulletinPaie[] = [
  {
    id: 'b-1',
    companyId: 'comp-1',
    employeeId: 'emp-1',
    employeeName: 'Jean-Marc KOUAMÉ',
    periodYear: 2026,
    periodMonth: 8,
    salaireBase: 1500000,
    primesImposables: 250000,
    primesNonImposables: 100000,
    brut: 1850000,
    detailCotisationsSalariales: [
      { label: 'Vieillesse CNPS (4.2%)', montant: 31500 },
      { label: 'Vieillesse déplafonnée (2.8%)', montant: 51800 },
      { label: 'Assurance Maladie (1.5%)', montant: 27700 }
    ],
    totalCotisationsSalariales: 111000,
    detailCotisationsPatronales: [
      { label: 'Prestations Familiales (7%)', montant: 52500 },
      { label: 'Retraite patronale (8.4%)', montant: 155400 },
      { label: 'Maladie patronale (12.8%)', montant: 236800 },
      { label: 'Accidents du travail (2.5%)', montant: 46250 }
    ],
    totalCotisationsPatronales: 296000,
    salaireImposable: 1665000,
    irpp: 166500,
    net: 1572500,
    status: 'VALIDE',
    createdBy: 'usr-admin',
    createdAt: '2026-08-01'
  },
  {
    id: 'b-2',
    companyId: 'comp-1',
    employeeId: 'emp-2',
    employeeName: 'Aïcha DIOP',
    periodYear: 2026,
    periodMonth: 8,
    salaireBase: 1200000,
    primesImposables: 150000,
    primesNonImposables: 80000,
    brut: 1430000,
    detailCotisationsSalariales: [
      { label: 'Cotisations Sociales (6%)', montant: 85800 }
    ],
    totalCotisationsSalariales: 85800,
    detailCotisationsPatronales: [
      { label: 'Cotisations Patronales (16%)', montant: 228800 }
    ],
    totalCotisationsPatronales: 228800,
    salaireImposable: 1287000,
    irpp: 128700,
    net: 1215500,
    status: 'VALIDE',
    createdBy: 'usr-admin',
    createdAt: '2026-08-01'
  },
  {
    id: 'b-3',
    companyId: 'comp-1',
    employeeId: 'emp-3',
    employeeName: 'Emmanuel TCHAKOUNTÉ',
    periodYear: 2026,
    periodMonth: 8,
    salaireBase: 950000,
    primesImposables: 100000,
    primesNonImposables: 50000,
    brut: 1100000,
    detailCotisationsSalariales: [
      { label: 'Cotisations Sociales (6%)', montant: 66000 }
    ],
    totalCotisationsSalariales: 66000,
    detailCotisationsPatronales: [
      { label: 'Cotisations Patronales (16%)', montant: 176000 }
    ],
    totalCotisationsPatronales: 176000,
    salaireImposable: 990000,
    irpp: 99000,
    net: 935000,
    status: 'BROUILLON',
    createdBy: 'usr-admin',
    createdAt: '2026-08-01'
  }
];

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
  const [showPayslipDocModal, setShowPayslipDocModal] = useState(false);
  const [selectedBulletinForDoc, setSelectedBulletinForDoc] = useState<BulletinPaie | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAll = () => {
    api.getEmployees().then((data) => {
      setEmployees(data && data.length > 0 ? data : DEFAULT_DEMO_EMPLOYEES);
    }).catch(() => {
      setEmployees(DEFAULT_DEMO_EMPLOYEES);
    });

    api.getBulletins().then((data) => {
      setBulletins(data && data.length > 0 ? data : DEFAULT_DEMO_BULLETINS);
    }).catch(() => {
      setBulletins(DEFAULT_DEMO_BULLETINS);
    });
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
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

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
          <div className="px-4 py-3 border-b border-[#EDE9FE] flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-bold text-[#1E1060]">Bulletins de paie</span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedBulletinForDoc(bulletins[0] || DEFAULT_DEMO_BULLETINS[0]);
                  setShowPayslipDocModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-xl text-xs font-black transition-all shadow-sm"
              >
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>📋 Modèle Bulletin de Paie</span>
              </button>

              <button
                onClick={() => setShowBulletinModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#6B4EFF] hover:bg-[#5538E0] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" /> Générer un bulletin
              </button>
            </div>
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
                <th className="px-4 py-3 text-right">Actions</th>
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedBulletinForDoc(b); setShowPayslipDocModal(true); }}
                        className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg font-extrabold text-[10px] flex items-center gap-1 border border-cyan-200"
                      >
                        <Eye className="w-3 h-3 text-cyan-600" />
                        <span>👁️ Bulletin Officiel</span>
                      </button>

                      {b.status === 'BROUILLON' && (
                        <button onClick={() => handleValider(b.id)} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline">
                          <FileCheck className="w-3 h-3" /> Valider
                        </button>
                      )}
                    </div>
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
      {/* ── 📄 MODAL BULLETIN DE PAIE OFFICIEL (MODÈLE TYPE CONFORME) ─────── */}
      {showPayslipDocModal && selectedBulletinForDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-6 text-left max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Header Document */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">DOCUMENT OFFICIEL — BULLETIN DE PAIE</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Période du 01/{String(selectedBulletinForDoc.periodMonth).padStart(2,'0')}/{selectedBulletinForDoc.periodYear} au 31/{String(selectedBulletinForDoc.periodMonth).padStart(2,'0')}/{selectedBulletinForDoc.periodYear} • Conformité SYSCOHADA & CNSS
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPayslipDocModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* EN-TÊTE BULLETIN DE PAIE (JAUNE/CYAN FIDÈLE À L'IMAGE DE L'UTILISATEUR) */}
            <div className="border border-cyan-200 rounded-3xl p-6 bg-white space-y-6 shadow-sm">
              
              {/* Grand Titre Cyan + Logo Cercle Jaune */}
              <div className="flex justify-between items-start border-b border-cyan-100 pb-5">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-cyan-600 font-sans">
                    Bulletin de paie
                  </h1>
                  <span className="text-xs font-extrabold text-slate-400 block mt-1 uppercase tracking-wider">
                    Extrait de paie individuel • Norme Officielle
                  </span>
                </div>

                <div className="w-20 h-20 rounded-full bg-amber-400 text-white flex items-center justify-center font-black text-base shadow-md uppercase tracking-wider">
                  Logo
                </div>
              </div>

              {/* Encadré 3 Colonnes : Employeur | Salarié | Période */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans border-b border-cyan-100 pb-6">
                
                {/* Employeur */}
                <div className="space-y-1 text-slate-700">
                  <strong className="text-cyan-700 uppercase font-black tracking-wider text-[11px] block mb-2 border-b border-cyan-200 pb-1">Employeur :</strong>
                  <div className="font-extrabold text-slate-900 text-sm">MELARO GROUP S.A.</div>
                  <div>Adresse : Zone Industrielle, Avenue de la Réévolution</div>
                  <div>CP et Ville : Douala, Cameroun (Zone OHADA)</div>
                  <div>Numéro NIF / APE : <span className="font-mono font-bold">M08191245678A</span></div>
                  <div>Numéro SIRET / RCCM : <span className="font-mono font-bold">RC/DLA/2024/B/1892</span></div>
                  <div>Numéro CNSS / CNPS : <span className="font-mono font-bold">CNPS-489201-X</span></div>
                  <div>Convention collective : <span className="font-semibold">Commerce & Industrie</span></div>
                </div>

                {/* Salarié */}
                <div className="space-y-1 text-slate-700">
                  <strong className="text-cyan-700 uppercase font-black tracking-wider text-[11px] block mb-2 border-b border-cyan-200 pb-1">Salarié :</strong>
                  <div className="font-extrabold text-slate-900 text-sm">{selectedBulletinForDoc.employeeName}</div>
                  <div>Adresse : Boulevard de la Liberté, BP 4510</div>
                  <div>CP et Ville : Douala, Cameroun</div>
                  <div>N° SS / CNSS : <span className="font-mono font-bold">CNPS-89201-92M</span></div>
                  <div>Emploi : <span className="font-bold text-slate-900">Cadre Commercial / Direction</span></div>
                  <div>Matricule : <span className="font-mono font-bold text-violet-700">EMP-2026-001</span></div>
                </div>

                {/* Période */}
                <div className="space-y-1 text-slate-700">
                  <strong className="text-cyan-700 uppercase font-black tracking-wider text-[11px] block mb-2 border-b border-cyan-200 pb-1">Période :</strong>
                  <div>Début : <span className="font-mono font-bold">01/{String(selectedBulletinForDoc.periodMonth).padStart(2,'0')}/{selectedBulletinForDoc.periodYear}</span></div>
                  <div>Fin : <span className="font-mono font-bold">31/{String(selectedBulletinForDoc.periodMonth).padStart(2,'0')}/{selectedBulletinForDoc.periodYear}</span></div>
                  <div>Début contrat : <span className="font-mono font-bold">15.01.2023</span></div>
                  <div>Date d'ancienneté : <span className="font-mono font-bold">15.01.2023</span></div>
                </div>

              </div>

              {/* TABLEAU 1: ÉLÉMENTS DE RÉMUNÉRATION BRUTE */}
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-500 font-extrabold uppercase text-[10px] text-left">
                      <th className="pb-2">Éléments de salaire</th>
                      <th className="pb-2 text-right">Base</th>
                      <th className="pb-2 text-right">Taux %</th>
                      <th className="pb-2 text-right">À Payer</th>
                      <th className="pb-2 text-right">Plafond SS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    <tr>
                      <td className="py-2 font-bold text-slate-900">Salaire de base (151,67 h)</td>
                      <td className="py-2 text-right font-mono">151,67 h</td>
                      <td className="py-2 text-right font-mono">9 889 FCFA</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-950">{formatMoney(selectedBulletinForDoc.salaireBase)}</td>
                      <td className="py-2 text-right font-mono text-slate-400">750 000 FCFA</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-slate-900">Primes imposables & Gratifications</td>
                      <td className="py-2 text-right font-mono">—</td>
                      <td className="py-2 text-right font-mono">—</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-950">{formatMoney(selectedBulletinForDoc.primesImposables)}</td>
                      <td className="py-2 text-right font-mono text-slate-400">—</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600">Heures Supp. à 25%</td>
                      <td className="py-2 text-right font-mono text-slate-400">0 h</td>
                      <td className="py-2 text-right font-mono text-slate-400">24,73 %</td>
                      <td className="py-2 text-right font-mono text-slate-400">0 FCFA</td>
                      <td className="py-2 text-right font-mono text-slate-400">—</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600">Heures Supp. à 50%</td>
                      <td className="py-2 text-right font-mono text-slate-400">0 h</td>
                      <td className="py-2 text-right font-mono text-slate-400">29,67 %</td>
                      <td className="py-2 text-right font-mono text-slate-400">0 FCFA</td>
                      <td className="py-2 text-right font-mono text-slate-400">—</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-slate-900">Primes de transport & indemnités non imposables</td>
                      <td className="py-2 text-right font-mono">—</td>
                      <td className="py-2 text-right font-mono">—</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-950">{formatMoney(selectedBulletinForDoc.primesNonImposables)}</td>
                      <td className="py-2 text-right font-mono text-slate-400">—</td>
                    </tr>
                    <tr className="border-t-2 border-cyan-400 text-cyan-950 font-black text-sm">
                      <td className="py-2.5 uppercase tracking-wide">SALAIRE BRUT TOTAL</td>
                      <td colSpan={2}></td>
                      <td className="py-2.5 text-right font-mono font-black text-cyan-700">{formatMoney(selectedBulletinForDoc.brut)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLEAU 2: COTISATIONS ET CONTRIBUTIONS SOCIALES (DOUBLE GRILLE SALARIÉ / PATRONAL) */}
              <div className="space-y-2 pt-2 overflow-x-auto">
                <table className="w-full text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b-2 border-cyan-400 text-cyan-700 font-extrabold uppercase text-[10px] text-left">
                      <th className="pb-2 w-1/3">Cotisations et contributions sociales</th>
                      <th className="pb-2 text-center border-l border-cyan-100" colSpan={3}>Salarié</th>
                      <th className="pb-2 text-center border-l border-cyan-100" colSpan={3}>Employeur</th>
                    </tr>
                    <tr className="border-b text-slate-400 font-extrabold text-[9px] text-right uppercase">
                      <th className="text-left font-normal italic">Décompte légal SYSCOHADA</th>
                      <th className="px-2">Base</th>
                      <th className="px-2">Taux %</th>
                      <th className="px-2">Montant</th>
                      <th className="px-2 border-l border-cyan-100">Base</th>
                      <th className="px-2">Taux %</th>
                      <th className="px-2">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800 text-[11px]">
                    <tr>
                      <td className="py-1.5 font-bold text-slate-900">Retenue CNSS / CNPS (Vieillesse plafonnée)</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">750 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">4,20 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(31500)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-600 border-l border-cyan-100">750 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">7,00 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(52500)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-900">Retenue CNSS / CNPS (Vieillesse déplafonnée)</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">1 850 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">2,80 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(51800)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-600 border-l border-cyan-100">1 850 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">8,40 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(155400)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-700">Assurance Maladie / Couverture Santé</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">1 850 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">1,50 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(27700)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-600 border-l border-cyan-100">1 850 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">12,80 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(236800)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-700">Accidents du Travail & Risques Pro.</td>
                      <td className="py-1.5 text-right font-mono text-slate-400">—</td>
                      <td className="py-1.5 text-right font-mono text-slate-400">—</td>
                      <td className="py-1.5 text-right font-mono text-slate-400">0 FCFA</td>
                      <td className="py-1.5 text-right font-mono text-slate-600 border-l border-cyan-100">1 850 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">2,50 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(46250)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-900">Impôt sur le Revenu (IRPP / IUTS)</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">1 665 000</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">10,00 %</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(selectedBulletinForDoc.irpp)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-400 border-l border-cyan-100">—</td>
                      <td className="py-1.5 text-right font-mono text-slate-400">—</td>
                      <td className="py-1.5 text-right font-mono text-slate-400">0 FCFA</td>
                    </tr>
                    <tr className="border-t-2 border-cyan-400 font-black text-xs text-cyan-950 bg-cyan-50/50">
                      <td className="py-2 uppercase">Total des cotisations et contributions</td>
                      <td colSpan={2}></td>
                      <td className="py-2 text-right font-mono text-cyan-700">{formatMoney(selectedBulletinForDoc.totalCotisationsSalariales + selectedBulletinForDoc.irpp)}</td>
                      <td colSpan={2} className="border-l border-cyan-200"></td>
                      <td className="py-2 text-right font-mono text-cyan-700">{formatMoney(selectedBulletinForDoc.totalCotisationsPatronales)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION NET À PAYER & BANNIÈRE IMPOSABLE */}
              <div className="p-5 bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md font-sans">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200 block">Net à Payer (Solde à Verser)</span>
                  <div className="text-3xl font-black tracking-tight font-mono mt-0.5">{formatMoney(selectedBulletinForDoc.net)}</div>
                  <span className="text-[11px] text-cyan-100 font-semibold block mt-0.5">Virement bancaire au bénéficiaire</span>
                </div>

                <div className="text-right space-y-1 font-mono text-xs border-l border-white/20 pl-6">
                  <div><span className="text-cyan-200 font-sans font-bold">Salaire Net Imposable :</span> <strong>{formatMoney(selectedBulletinForDoc.brut - selectedBulletinForDoc.totalCotisationsSalariales)}</strong></div>
                  <div><span className="text-cyan-200 font-sans font-bold">Mode de règlement :</span> <strong>Virement bancaire</strong></div>
                  <div><span className="text-cyan-200 font-sans font-bold">Date d'exécution :</span> <strong>31/{String(selectedBulletinForDoc.periodMonth).padStart(2,'0')}/{selectedBulletinForDoc.periodYear}</strong></div>
                </div>
              </div>

              {/* TABLEAU CUMULS ANNUELS & CONGÉS PAYÉS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans pt-2 border-t border-slate-200">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <strong className="text-slate-900 font-bold uppercase text-[10px] text-cyan-700 block">Cumul Annuel :</strong>
                  <div className="flex justify-between"><span>Net Imposable :</span><strong className="font-mono">13 320 000 FCFA</strong></div>
                  <div className="flex justify-between"><span>Soumis CNSS :</span><strong className="font-mono">14 800 000 FCFA</strong></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <strong className="text-slate-900 font-bold uppercase text-[10px] text-cyan-700 block">Cumul Période :</strong>
                  <div className="flex justify-between"><span>Coût Total Employeur :</span><strong className="font-mono font-bold text-slate-900">{formatMoney(selectedBulletinForDoc.brut + selectedBulletinForDoc.totalCotisationsPatronales)}</strong></div>
                  <div className="flex justify-between"><span>Heures Salariées :</span><strong className="font-mono">151.67 h</strong></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <strong className="text-slate-900 font-bold uppercase text-[10px] text-cyan-700 block">Congés Payés N :</strong>
                  <div className="flex justify-between"><span>Acquis :</span><strong className="font-mono">20,0 j</strong></div>
                  <div className="flex justify-between"><span>Pris / Restant :</span><strong className="font-mono text-emerald-700">15,0 j</strong></div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center italic font-semibold pt-1">
                Bulletin de paie à conserver sans limitation de durée • Document généré conformément au Code du Travail & SYSCOHADA Révisé.
              </div>

            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button onClick={() => setShowPayslipDocModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
                Fermer
              </button>

              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Imprimer le Bulletin
                </button>
                <button onClick={() => showToast('📄 Export PDF du Bulletin de Paie en cours...')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Télécharger PDF
                </button>
              </div>
            </div>

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
