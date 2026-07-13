'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers';
import { useRouter } from 'next/navigation';
import { 
  Coins, 
  LogOut, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ShieldAlert,
  User as UserIcon,
  RefreshCw,
  Phone
} from 'lucide-react';
import { api } from '@/lib/api';

interface CashWallet {
  balanceTotal: number;
  balanceFrozen: number;
  currency: string;
}

interface Transaction {
  idInternal: string;
  idPawaPay: string | null;
  amount: number;
  type: 'DEPOT' | 'RETRAIT';
  status: 'EN_COURS' | 'SUCCES' | 'ECHEC';
  createdAt: string;
}

export default function Dashboard() {
  const { user, token, logout, loading, refreshUser } = useAuth();
  const router = useRouter();

  // Wallet and Transactions states
  const [cashWallet, setCashWallet] = useState<CashWallet | null>(null);
  const [securities, setSecurities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Deposit/Withdrawal Fields
  const [amount, setAmount] = useState('5000');
  const [phone, setPhone] = useState('');
  const [correspondent, setCorrespondent] = useState('ORANGE_CI');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  // Polling State for Pending Transactions
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      setPhone(user.phone);
      fetchData();
    }
  }, [user, loading, router]);

  // Handle Polling cleanup
  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [walletData, securitiesData, txData] = await Promise.all([
        api.wallets.getCash(token),
        api.wallets.getSecurities(token),
        api.wallets.getTransactions(token),
      ]);
      setCashWallet(walletData);
      setSecurities(securitiesData);
      setTransactions(txData);
    } catch (e) {
      console.error('Erreur lors du chargement des données:', e);
    } finally {
      setDataLoading(false);
    }
  };

  // Polling function to monitor pending transaction status
  const startPolling = (txId: string) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    setPendingTxId(txId);
    setPendingStatus('EN_COURS');

    pollingInterval.current = setInterval(async () => {
      if (!token) return;
      try {
        const txs: Transaction[] = await api.wallets.getTransactions(token);
        const currentTx = txs.find(t => t.idInternal === txId);
        
        if (currentTx) {
          // Mettre à jour l'historique en direct
          setTransactions(txs);

          if (currentTx.status !== 'EN_COURS') {
            // Fin du traitement
            clearInterval(pollingInterval.current!);
            pollingInterval.current = null;
            setPendingStatus(currentTx.status);
            
            // Rafraîchir les soldes
            const walletData = await api.wallets.getCash(token);
            setCashWallet(walletData);
            
            if (currentTx.status === 'SUCCES') {
              alert(`Félicitations ! Votre transaction de ${currentTx.amount.toLocaleString()} XOF a été confirmée.`);
            } else {
              alert(`La transaction de ${currentTx.amount.toLocaleString()} XOF a échoué.`);
            }
            
            // Masquer les modaux d'attente après 2 secondes
            setTimeout(() => {
              setPendingTxId(null);
              setPendingStatus(null);
            }, 2000);
          }
        }
      } catch (e) {
        console.error('Erreur lors du polling:', e);
      }
    }, 3000); // Polling toutes les 3 secondes
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTxLoading(true);
    setTxError('');

    try {
      const res = await api.pawapay.initiateDeposit({
        amount: parseFloat(amount),
        phone,
        correspondent,
      }, token);

      setShowDepositModal(false);
      setTxLoading(false);
      
      // Lancer le polling en temps réel
      startPolling(res.idInternal);
    } catch (err: any) {
      setTxError(err.message || 'Erreur lors de l\'initiation du dépôt');
      setTxLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTxLoading(true);
    setTxError('');

    try {
      const res = await api.pawapay.initiateWithdraw({
        amount: parseFloat(amount),
        phone,
        correspondent,
      }, token);

      setShowWithdrawModal(false);
      setTxLoading(false);
      
      // Lancer le polling en temps réel
      startPolling(res.idInternal);
    } catch (err: any) {
      setTxError(err.message || 'Erreur lors de l\'initiation du retrait');
      setTxLoading(false);
    }
  };

  if (loading || !user || dataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coins className="h-6 w-6 text-emerald-400" />
          <span className="font-extrabold tracking-wider text-lg text-white">BAOU <span className="text-emerald-400 font-medium">FINANCE</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <UserIcon className="h-4 w-4 text-emerald-400" />
            <span>{user.firstName} {user.lastName}</span>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Banner Polling en cours */}
        {pendingTxId && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-emerald-400 animate-spin" />
              <div>
                <h4 className="font-bold text-white">Validation Mobile Money en cours...</h4>
                <p className="text-xs text-slate-400">Nous surveillons le paiement en temps réel avec le réseau PawaPay. Veuillez confirmer sur votre mobile.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 uppercase">
              Statut : {pendingStatus}
            </div>
          </div>
        )}

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Solde Cash */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Solde Cash disponible</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white" id="balanceDisplay">
                  {cashWallet ? cashWallet.balanceTotal.toLocaleString() : '0'}
                </span>
                <span className="text-lg font-bold text-emerald-400">{cashWallet?.currency}</span>
              </div>
              {cashWallet && cashWallet.balanceFrozen > 0 && (
                <span className="text-xs text-amber-400 mt-2 block">
                  🔒 Gelé (en traitement) : {cashWallet.balanceFrozen.toLocaleString()} XOF
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => setShowDepositModal(true)}
                id="depositBtn"
                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-2.5 px-3 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4" />
                Dépôt
              </button>
              <button 
                onClick={() => setShowWithdrawModal(true)}
                id="withdrawBtn"
                className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <ArrowDownLeft className="h-4 w-4" />
                Retrait
              </button>
            </div>
          </div>

          {/* Card Profil & KYC */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Statut Conformité KYC</span>
              <div className="flex items-center gap-2.5 mt-2">
                {user.kycStatus === 'APPROUVE' ? (
                  <>
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    <span className="text-lg font-bold text-white">Compte Validé</span>
                  </>
                ) : user.kycStatus === 'REJETE' ? (
                  <>
                    <ShieldAlert className="h-7 w-7 text-rose-500" />
                    <span className="text-lg font-bold text-white">Dossier Rejeté</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-7 w-7 text-amber-500 animate-pulse" />
                    <span className="text-lg font-bold text-white" id="kycStatus">En cours d'étude</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {user.kycStatus === 'APPROUVE' 
                  ? 'Votre dossier est conforme. Vos limites de dépôts sont étendues.'
                  : 'Votre compte-titres boursier SGI est en cours de création automatique.'
                }
              </p>
            </div>
            <div className="border-t border-slate-800/50 pt-4 text-xs text-slate-500 flex justify-between">
              <span>SGI : Société Générale</span>
              <span>Identifiant : {user.phone}</span>
            </div>
          </div>

          {/* Card Investissement */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Portefeuille d'actions</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">
                  {securities.reduce((acc, curr) => acc + (curr.quantity * curr.averageBuyPrice), 0).toLocaleString()}
                </span>
                <span className="text-lg font-bold text-slate-400">XOF</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+0.0% (Evolution marché)</span>
              </div>
            </div>
            <div className="border-t border-slate-800/50 pt-4 text-xs text-slate-500">
              Nombre de lignes de titres : {securities.length}
            </div>
          </div>
        </div>

        {/* Bottom Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lignes d'actions */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="font-extrabold text-white text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span>Titres Boursiers (BRVM)</span>
            </h3>
            {securities.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500">Aucune action achetée pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {securities.map((sec, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div>
                      <span className="font-bold text-white text-sm block">{sec.codeValeur}</span>
                      <span className="text-xs text-slate-500">{sec.quantity} parts détenant</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">{(sec.quantity * sec.averageBuyPrice).toLocaleString()} XOF</span>
                      <span className="text-[10px] text-slate-400 block">P.M.P: {sec.averageBuyPrice} XOF</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historique des transactions */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="font-extrabold text-white text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-400" />
              <span>Historique des paiements</span>
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">Aucune transaction enregistrée.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Montant</th>
                      <th className="pb-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {transactions.map((tx, i) => (
                      <tr key={i} className="text-sm">
                        <td className="py-3.5 font-bold flex items-center gap-2">
                          {tx.type === 'DEPOT' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded"><ArrowUpRight className="h-4 w-4" /></span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-400 p-1 rounded"><ArrowDownLeft className="h-4 w-4" /></span>
                          )}
                          <span>{tx.type === 'DEPOT' ? 'Dépôt' : 'Retrait'}</span>
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 font-extrabold text-white">
                          {tx.amount.toLocaleString()} XOF
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            tx.status === 'SUCCES' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : tx.status === 'ECHEC' 
                              ? 'bg-rose-500/10 text-rose-400' 
                              : 'bg-amber-500/10 text-amber-400 animate-pulse'
                          }`}>
                            {tx.status === 'SUCCES' ? 'Confirmé' : tx.status === 'ECHEC' ? 'Échoué' : 'En attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DEPOT */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Dépôt par Mobile Money</h3>
            <p className="text-slate-400 text-xs mb-6">Rechargez votre compte boursier localement.</p>

            {txError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-4">
                {txError}
              </div>
            )}

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Montant (XOF)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="500"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Opérateur</label>
                <select 
                  value={correspondent}
                  onChange={(e) => setCorrespondent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ORANGE_CI">Orange Money</option>
                  <option value="MTN_CI">MTN Mobile Money</option>
                  <option value="MOOV_CI">Moov Money</option>
                  <option value="WAVE_CI">Wave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">N° Mobile Money de débit</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="2250700000000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  id="confirmDepositBtn"
                  disabled={txLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer flex justify-center items-center"
                >
                  {txLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RETRAIT */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Retrait par Mobile Money</h3>
            <p className="text-slate-400 text-xs mb-6">Retirez des fonds instantanément vers votre wallet mobile.</p>

            {txError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-4">
                {txError}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Montant (XOF)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="500"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Opérateur</label>
                <select 
                  value={correspondent}
                  onChange={(e) => setCorrespondent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ORANGE_CI">Orange Money</option>
                  <option value="MTN_CI">MTN Mobile Money</option>
                  <option value="MOOV_CI">Moov Money</option>
                  <option value="WAVE_CI">Wave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">N° Mobile Money de crédit</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="2250700000000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  id="confirmWithdrawBtn"
                  disabled={txLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer flex justify-center items-center"
                >
                  {txLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
