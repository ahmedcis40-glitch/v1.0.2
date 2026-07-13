'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './providers';
import { useRouter } from 'next/navigation';
import { Coins, Lock, TrendingUp, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);
    try {
      await login({ phoneOrEmail, password });
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides');
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-slate-950">
      {/* Colonne d'information / Marque */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Coins className="h-8 w-8 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            BAOU <span className="text-emerald-400 font-medium">FINANCE</span>
          </span>
        </div>

        <div className="my-12 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Investissez en Bourse simplement depuis la Côte d'Ivoire.
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Rechargez votre compte en Francs XOF par Mobile Money (Orange, MTN, Moov, Wave) et achetez des actions de la BRVM en quelques secondes.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Sécurisé & Agréé</h4>
                <p className="text-sm text-slate-400">Partenariat avec des SGI agréées par la CREPMF.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Épargne Récurrente</h4>
                <p className="text-sm text-slate-400">Automatisez vos investissements avec nos plans DCA.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <HelpCircle className="h-4 w-4" />
          <span>Besoin d'aide ? Contactez notre support 24/7</span>
        </div>
      </div>

      {/* Colonne Formulaire de Connexion */}
      <div className="w-full md:w-[480px] flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Bon retour</h2>
            <p className="text-slate-400 text-sm">Connectez-vous pour gérer votre portefeuille.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                N° de téléphone ou Email
              </label>
              <input
                type="text"
                id="phoneOrEmail"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="Ex: 2250700000000 ou jean@koffi.ci"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Mot de passe
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <Lock className="absolute right-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              id="loginBtn"
              disabled={loginLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50 text-slate-950 font-bold py-3.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {loginLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Nouveau sur Baou Finance ?{' '}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
