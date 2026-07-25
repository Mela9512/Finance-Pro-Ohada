import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { api, ApiError } from '../services/api';

export const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-6 border border-slate-800">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <KeyRound className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="text-lg font-bold text-white">Mot de passe oublié</h1>
          <p className="text-xs text-slate-400 text-center">Recevez un lien pour définir un nouveau mot de passe</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="flex items-start space-x-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Envoyer le lien</span>
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400">
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
};
