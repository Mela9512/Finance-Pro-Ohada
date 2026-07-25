import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Lock, User as UserIcon, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';

export const AcceptInviteScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const token = searchParams.get('token') || '';

  const [invite, setInvite] = useState<{ email: string; role: string; companyName: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getInvite(token)
      .then(setInvite)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Invitation introuvable"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.acceptInvite({ token, name, password });
      setSession(res.user, res.company);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'acceptation de l'invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || loadError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-4 border border-slate-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-slate-300">{loadError || 'Lien d\'invitation invalide.'}</p>
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-6 border border-slate-800">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <UserPlus className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="text-lg font-bold text-white">Rejoindre {invite.companyName}</h1>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Building2 className="w-3.5 h-3.5" />
            <span>{invite.email} · Rôle {invite.role}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Ex: Fatou Diop"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Choisissez un mot de passe</label>
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
            <span>Créer mon compte et rejoindre</span>
          </button>
        </form>
      </div>
    </div>
  );
};
