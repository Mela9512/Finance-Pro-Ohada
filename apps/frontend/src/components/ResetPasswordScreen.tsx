import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { api, ApiError } from '../services/api';

export const ResetPasswordScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-4 border border-slate-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-slate-300">Lien de réinitialisation invalide.</p>
          <Link to="/forgot-password" className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold">Demander un nouveau lien</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-6 border border-slate-800">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <KeyRound className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="text-lg font-bold text-white">Nouveau mot de passe</h1>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Mot de passe mis à jour. Redirection vers la connexion...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Mettre à jour le mot de passe</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
