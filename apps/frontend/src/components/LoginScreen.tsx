import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { AuthLayout } from './AuthLayout';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Identifiants incorrects ou erreur de serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Ravi de vous revoir"
      subtitle="Accédez à votre espace comptable SYSCOHADA"
      showNavToggle={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-4 font-medium animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
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
              className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-900 font-bold outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Password Field with Eye Toggle */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
            <span className="text-red-500 mr-0.5">*</span>Mot de passe
          </label>
          <div className="relative group">
            <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563eb] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mot de passe"
              className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-12 py-3.5 text-xs text-slate-900 font-bold outline-none transition-all duration-200 placeholder:text-slate-400 placeholder:font-normal"
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

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center space-x-2 text-slate-600 font-semibold cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
            />
            <span className="group-hover:text-slate-900 transition-colors">Se souvenir de moi</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-xs font-extrabold text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition-all"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-[0.99] text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center space-x-2 mt-3 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Se connecter</span>
            </>
          )}
        </button>

        {/* Back to landing link */}
        <div className="text-center pt-3">
          <Link to="/" className="text-slate-400 hover:text-slate-700 text-xs font-semibold transition-colors">
            ← Voir la landing page
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginScreen;
