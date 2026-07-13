'use client';

import React, { useState } from 'react';
import { useAuth } from '../providers';
import { useRouter } from 'next/navigation';
import { Coins, User, Phone, Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+2250700000000');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [password, setPassword] = useState('');
  const [consentSMS, setConsentSMS] = useState(true);
  const [consentWhatsApp, setConsentWhatsApp] = useState(true);

  const [error, setError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        phone,
        whatsappPhone: whatsappPhone || undefined,
        password,
        consentSMS,
        consentWhatsApp,
      });
      alert('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
      setRegLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 min-h-screen">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-emerald-400" />
            <span className="font-bold text-white text-sm">BAOU FINANCE</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Créez votre compte</h2>
          <p className="text-slate-400 text-sm">Ouvrez votre wallet boursier en Côte d'Ivoire.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Prénom</label>
              <div className="relative">
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <User className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Nom</label>
              <div className="relative">
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Koffi"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <User className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@koffi.ci"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              N° de Téléphone (Mobile Money principal)
            </label>
            <div className="relative">
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2250700000000"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Phone className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              N° Whatsapp (optionnel)
            </label>
            <div className="relative">
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+2250700000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Phone className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentSMS}
                onChange={(e) => setConsentSMS(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="text-xs text-slate-400">J'accepte de recevoir des notifications d'alertes par SMS.</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentWhatsApp}
                onChange={(e) => setConsentWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="text-xs text-slate-400">J'accepte de recevoir mes reçus de transactions par WhatsApp.</span>
            </label>
          </div>

          <button
            type="submit"
            id="registerBtn"
            disabled={regLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50 text-slate-950 font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4"
          >
            {regLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
