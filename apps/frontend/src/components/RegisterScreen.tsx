import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Lock, Mail, User as UserIcon, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

export const RegisterScreen: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ name, email, password, companyName });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la création du compte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 py-10">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-6 border border-slate-800">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="font-extrabold text-slate-950 text-lg tracking-wider">FP</span>
          </div>
          <h1 className="text-lg font-bold text-white">Créer votre espace FinancePro OHADA</h1>
          <p className="text-xs text-slate-400 text-center">Un nouvel espace de travail isolé sera créé pour votre entreprise</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nom de l'entreprise</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                minLength={2}
                className="w-full glass-input rounded-lg pl-9 pr-3 py-2.5 text-sm"
                placeholder="Ex: CONGO TRADING SARL"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Votre nom complet</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="w-full glass-input rounded-lg pl-9 pr-3 py-2.5 text-sm"
                placeholder="Ex: Alain Kouassi"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Adresse e-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full glass-input rounded-lg pl-9 pr-3 py-2.5 text-sm"
                placeholder="vous@entreprise.cg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full glass-input rounded-lg pl-9 pr-3 py-2.5 text-sm"
                placeholder="8 caractères minimum"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Créer mon compte</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Déjà un compte ? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};
