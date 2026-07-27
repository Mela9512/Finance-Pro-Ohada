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
      setError("Vous devez accepter les conditions d'utilisation avant de pouvoir créer votre compte.");
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-4 font-medium animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Company Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
            <span className="text-red-500 mr-0.5">*</span>Nom de l'entreprise
          </label>
          <div className="relative group">
            <Building2 className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563eb] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              minLength={2}
              placeholder="Ex: CONGO TRADING SA"
              className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 font-bold outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* User Full Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
            <span className="text-red-500 mr-0.5">*</span>Votre nom complet
          </label>
          <div className="relative group">
            <UserIcon className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563eb] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Ex: Alain Kouassi"
              className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 font-bold outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
            <span className="text-red-500 mr-0.5">*</span>Adresse e-mail
          </label>
          <div className="relative group">
            <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563eb] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre.email@entreprise.cg"
              className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 font-bold outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
            <span className="text-red-500 mr-0.5">*</span>Mot de passe
          </label>
          <div className="relative group">
            <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563eb] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8 caractères minimum"
              className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-12 py-3 text-xs text-slate-900 font-bold outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition-all"
              title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Checkbox Terms Acceptance */}
        <div className="pt-1">
          <label className="flex items-start space-x-2 text-xs text-slate-600 font-semibold cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
            />
            <span className="leading-snug text-[11px] group-hover:text-slate-900 transition-colors">
              J'accepte les <span className="font-extrabold text-[#2563eb]">Conditions Générales d'Utilisation</span> et la <span className="font-extrabold text-[#2563eb]">Politique de Confidentialité</span>.
            </span>
          </label>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || !acceptTerms}
          className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-[0.99] disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center space-x-2 mt-3"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
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
