import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Lock, Mail, User as UserIcon, Building2, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { AuthLayout } from './AuthLayout';

export const RegisterScreen: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation pour continuer.");
      return;
    }
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
    <AuthLayout
      title="Bienvenue"
      subtitle="Créez votre espace entreprise FinancePro OHADA"
      showNavToggle={true}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Company Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            <span className="text-red-500 mr-0.5">*</span>Nom de l'entreprise
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              minLength={2}
              placeholder="Ex: CONGO TRADING SA"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* User Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
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
              placeholder="Ex: Alain Kouassi"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
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
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            <span className="text-red-500 mr-0.5">*</span>Mot de passe
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
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
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

        {/* Checkbox Terms Acceptance */}
        <div className="pt-1">
          <label className="flex items-start space-x-2 text-xs text-slate-600 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
            />
            <span className="leading-snug text-[11px]">
              J'accepte les <span className="font-bold text-[#2563eb]">Conditions Générales d'Utilisation</span> et la <span className="font-bold text-[#2563eb]">Politique de Confidentialité</span>.
            </span>
          </label>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || !acceptTerms}
          className="w-full py-3.5 px-6 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Créer mon compte</span>
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterScreen;
