'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import { ShieldCheck, Landmark, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

function SimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get('type') || 'DEPOT';
  const isWithdrawal = type === 'RETRAIT';
  
  const depositId = searchParams.get('depositId') || searchParams.get('payoutId') || 'tx-mock-123';
  const amount = searchParams.get('amount') || '5000';
  const phone = searchParams.get('phone') || 'Non spécifié';

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerCallback = async (result: 'COMPLETED' | 'FAILED') => {
    setStatus('loading');
    setErrorMsg('');
    try {
      // Appeler le webhook du backend en simulant PawaPay
      const res = await api.pawapay.simulateCallback(depositId, result, isWithdrawal);
      if (!res.ok) {
        throw new Error("Impossible de communiquer avec le backend NestJS.");
      }

      setStatus(result === 'COMPLETED' ? 'success' : 'failed');
      
      // Attendre 1.5s pour l'effet visuel puis rediriger vers le dashboard
      setTimeout(() => {
        router.push(`/dashboard?paymentResult=${result === 'COMPLETED' ? 'success' : 'failure'}&amount=${amount}&type=${type}`);
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e.message || "Erreur de simulation");
      setStatus('idle');
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Liseré tricolore ivoirien */}
      <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>

      <div className="text-center space-y-3 mb-8">
        <div className="flex justify-center mb-2">
          <Logo className="h-12 w-12" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {isWithdrawal ? "Simulateur de Retrait PawaPay" : "Simulateur de Paiement PawaPay"}
        </h2>
        <p className="text-xs text-slate-400">Environnement Sandbox Local (Côte d'Ivoire)</p>
      </div>

      {status === 'loading' && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 border-b-2 border-emerald-500"></div>
          <p className="text-xs text-slate-400">Transmission du statut de transaction au serveur NestJS...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {isWithdrawal ? "Transfert Réussi !" : "Paiement Réussi !"}
          </h3>
          <p className="text-xs text-slate-400">Redirection vers votre tableau de bord...</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-450">
            <XCircle className="h-10 w-10 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {isWithdrawal ? "Retrait Échoué" : "Paiement Annulé"}
          </h3>
          <p className="text-xs text-slate-400">Redirection vers votre tableau de bord...</p>
        </div>
      )}

      {status === 'idle' && (
        <div className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Fiche de transaction */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Bénéficiaire :</span>
              <span className="text-white font-bold">
                {isWithdrawal ? "Votre Compte Mobile" : "BAOU Finance CI"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">N° Mobile :</span>
              <span className="text-white">{phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {isWithdrawal ? "ID Retrait :" : "ID Dépôt :"}
              </span>
              <span className="text-slate-400 text-[10px] truncate max-w-[150px]">{depositId}</span>
            </div>
            <div className="border-t border-slate-850 pt-3 flex justify-between text-sm font-bold">
              <span className="text-slate-400 font-sans">
                {isWithdrawal ? "Montant à recevoir :" : "Montant à payer :"}
              </span>
              <span className="text-orange-400 font-mono">{parseFloat(amount).toLocaleString()} XOF</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => triggerCallback('COMPLETED')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black py-3.5 rounded-xl text-xs transition-colors flex justify-center items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="h-4.5 w-4.5" />
              <span>
                {isWithdrawal ? "Simuler le Retrait Réussi" : "Simuler le Paiement Réussi"}
              </span>
            </button>
            <button
              onClick={() => triggerCallback('FAILED')}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-850 text-white font-bold py-3.5 rounded-xl text-xs transition-colors flex justify-center items-center gap-2 cursor-pointer"
            >
              <XCircle className="h-4.5 w-4.5 text-rose-500" />
              <span>
                {isWithdrawal ? "Simuler l'Échec / Rejet" : "Simuler l'Échec / Annulation"}
              </span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 border-t border-slate-850 pt-4 flex items-center justify-center gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            <span>Passerelle de test local</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentSimulationPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500 mx-auto"></div>
          <p className="text-xs text-slate-400">Chargement de la passerelle de test...</p>
        </div>
      }>
        <SimulationContent />
      </Suspense>
    </div>
  );
}
