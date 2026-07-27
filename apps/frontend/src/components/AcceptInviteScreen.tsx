import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { AuthLayout } from './AuthLayout';

export const AcceptInviteScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const token = searchParams.get('token') || '';

  const [invite, setInvite] = useState<{ email: string; role: string; companyName: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <AuthLayout title="Invitation" subtitle="Acceptation de votre invitation d'équipe" showNavToggle={false}>
        <div className="text-center space-y-4 py-6">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-sm font-medium text-slate-700">{loadError || 'Lien d\'invitation invalide.'}</p>
          <Link to="/login" className="inline-block px-6 py-2.5 bg-[#2563eb] text-white font-bold rounded-full text-xs">
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (!invite) {
    return (
      <AuthLayout title="Invitation" subtitle="Chargement des détails de l'invitation..." showNavToggle={false}>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`Rejoindre ${invite.companyName}`}
      subtitle={`Invitation envoyée à ${invite.email} · Rôle : ${invite.role}`}
      showNavToggle={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            <span className="text-red-500 mr-0.5">*</span>Votre nom complet
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Ex: Fatou Diop"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            <span className="text-red-500 mr-0.5">*</span>Choisissez un mot de passe
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8 caractères minimum"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-10 py-3 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Accepter et rejoindre la société</span>
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AcceptInviteScreen;
