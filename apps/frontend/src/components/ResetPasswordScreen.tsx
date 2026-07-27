import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { api, ApiError } from '../services/api';
import { AuthLayout } from './AuthLayout';

export const ResetPasswordScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <AuthLayout
      title="Réinitialisation"
      subtitle="Choisissez un nouveau mot de passe sécurisé"
      showNavToggle={false}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl p-5 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Mot de passe mis à jour !</span>
            </div>
            <p className="text-slate-600 text-xs">Redirection automatique vers l'écran de connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="text-red-500 mr-0.5">*</span>Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  <KeyRound className="w-4 h-4" />
                  <span>Enregistrer le nouveau mot de passe</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-bold text-[#2563eb] hover:underline">
            ← Annuler et se connecter
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordScreen;
