import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#f4f7fc] text-slate-900 font-sans p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md space-y-6 border border-slate-200 shadow-2xl">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0f2d5e] flex items-center justify-center shadow-lg shadow-blue-950/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">FinancePro <span className="text-blue-900 font-normal">OHADA</span></h1>
          <p className="text-xs text-slate-500 font-medium">Connexion à votre espace comptable SYSCOHADA</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Adresse e-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 font-bold focus:bg-white focus:border-blue-900"
                placeholder="vous@entreprise.ci"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">Mot de passe</label>
              <Link to="/forgot-password" className="text-blue-900 hover:underline text-[11px] font-bold">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 font-bold focus:bg-white focus:border-blue-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#0f2d5e] hover:bg-blue-900 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Se Connecter au SaaS</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500 font-medium space-y-2">
          <div>
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-blue-900 font-bold hover:underline">
              Créer un espace entreprise
            </Link>
          </div>
          <div>
            <Link to="/" className="text-slate-400 hover:text-slate-700 underline text-[11px]">
              ← Voir la Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
