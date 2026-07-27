import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { api, ApiError } from '../services/api';
import { AuthLayout } from './AuthLayout';

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
    <AuthLayout
      title="Mot de passe oublié ?"
      subtitle="Entrez votre adresse email pour recevoir un lien de réinitialisation"
      showNavToggle={false}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl p-5 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Email envoyé avec succès !</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Si un compte existe avec l'adresse <span className="font-bold text-slate-900">{email}</span>, un lien de réinitialisation y a été envoyé.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="text-red-500 mr-0.5">*</span>Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre.email@entreprise.cg"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
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
                  <KeyRound className="w-4 h-4" />
                  <span>Envoyer le lien de réinitialisation</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-bold text-[#2563eb] hover:underline">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordScreen;
