'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { ShieldCheck, Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin-portal/dashboard');
      } else if (user.role === 'SUPPORT') {
        router.push('/support-portal');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);
    try {
      await login({ phoneOrEmail: email, password });
    } catch (err: any) {
      setError(err.message || "Identifiants invalides ou accès non autorisé.");
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Liseré tricolore ivoirien */}
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>

        <div className="text-center space-y-3 mb-8">
          <div className="flex justify-center mb-2">
            <Logo className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Portail Administration</h2>
          <p className="text-xs text-slate-450 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-orange-400" />
            <span>Accès Sécurisé Back-office</span>
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Adresse Email Admin
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@baou.ci"
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-10 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-orange-500 text-xs transition-colors"
              />
              <Mail className="absolute right-3.5 top-3.5 h-4.5 w-4.5 text-slate-650" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-855 rounded-xl pl-4 pr-10 py-3.5 text-white placeholder-slate-750 focus:outline-none focus:border-orange-500 text-xs transition-colors"
              />
              <Lock className="absolute right-3.5 top-3.5 h-4.5 w-4.5 text-slate-650" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-orange-500 hover:bg-orange-650 text-slate-950 font-black py-4 rounded-xl text-xs transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer mt-6"
          >
            {loginLoading ? (
              <div className="animate-spin rounded-full h-4.5 w-4.5 border-t-2 border-slate-950"></div>
            ) : (
              <>
                <span>Se connecter au Back-office</span>
                <LogIn className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-350 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à l'accueil client</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
