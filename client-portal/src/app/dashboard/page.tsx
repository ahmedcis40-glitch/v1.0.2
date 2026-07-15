'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../providers';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Coins, 
  LogOut, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  ShieldAlert,
  User as UserIcon,
  RefreshCw,
  Phone,
  Maximize2,
  X,
  Globe
} from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

interface CashWallet {
  balanceTotal: number;
  balanceFrozen: number;
  currency: string;
}

interface Transaction {
  idInternal: string;
  waveSessionId?: string | null;
  wavePaymentId?: string | null;
  amount: number;
  type: 'DEPOT' | 'RETRAIT';
  status: 'EN_COURS' | 'SUCCES' | 'ECHEC';
  createdAt: string;
}

interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  open?: number;
  high?: number;
  low?: number;
  volumeShares?: number;
  volumeXof?: number;
}

function DashboardContent() {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core States
  const [cashWallet, setCashWallet] = useState<CashWallet | null>(null);
  const [securities, setSecurities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marketStocks, setMarketStocks] = useState<Stock[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [myDocuments, setMyDocuments] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Forms
  const [amount, setAmount] = useState('5000');
  const [phone, setPhone] = useState('');
  const [correspondent, setCorrespondent] = useState('WAVE_CI');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  // Trading Forms
  const [tradeType, setTradeType] = useState<'ACHAT' | 'VENTE'>('ACHAT');
  const [tradeQuantity, setTradeQuantity] = useState('1');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');

  // Polling
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Navigation Filter
  const [activeMarketTab, setActiveMarketTab] = useState<'holdings' | 'market'>('holdings');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'payments' | 'orders'>('payments');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      setPhone(user.phone);
      fetchData();
      const interval = setInterval(fetchData, 5000); // Live update de tout le dashboard (dont les cours)
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  useEffect(() => {
    const result = searchParams.get('paymentResult');
    const depositAmount = searchParams.get('amount');
    const type = searchParams.get('type') || 'DEPOT';
    const isWithdraw = type === 'RETRAIT';
    if (result) {
      if (result === 'success') {
        if (isWithdraw) {
          alert(`Retrait réussi ! Votre Mobile Money a été crédité de ${parseFloat(depositAmount || '0').toLocaleString()} XOF.`);
        } else {
          alert(`Dépôt réussi ! Votre solde cash a été crédité de ${parseFloat(depositAmount || '0').toLocaleString()} XOF.`);
        }
      } else if (result === 'failure') {
        if (isWithdraw) {
          alert("Le retrait a échoué ou a été annulé.");
        } else {
          alert("Le dépôt a échoué ou a été annulé par l'utilisateur.");
        }
      }
      router.replace('/dashboard');
      fetchData();
    }
  }, [searchParams]);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [walletData, securitiesData, txData, stocksData, ordersData, docsData] = await Promise.all([
        api.wallets.getCash(token),
        api.wallets.getSecurities(token),
        api.wallets.getTransactions(token),
        api.market.getStocks(),
        api.orders.getMy(token),
        api.wallets.getDocuments(token),
      ]);
      setCashWallet(walletData);
      setSecurities(securitiesData);
      setTransactions(txData);
      setMarketStocks(stocksData);
      setOrders(ordersData);
      setMyDocuments(docsData || []);
    } catch (e) {
      console.error('Erreur de chargement:', e);
    } finally {
      setDataLoading(false);
    }
  };

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
          setTransactions(txs);

          if (currentTx.status !== 'EN_COURS') {
            clearInterval(pollingInterval.current!);
            pollingInterval.current = null;
            setPendingStatus(currentTx.status);
            
            const walletData = await api.wallets.getCash(token);
            setCashWallet(walletData);
            
            if (currentTx.status === 'SUCCES') {
              alert(`Félicitations ! Votre transaction de ${currentTx.amount.toLocaleString()} XOF a été confirmée.`);
            } else {
              alert(`La transaction de ${currentTx.amount.toLocaleString()} XOF a échoué.`);
            }
            
            setTimeout(() => {
              setPendingTxId(null);
              setPendingStatus(null);
            }, 2000);
          }
        }
      } catch (e) {
        console.error('Erreur polling:', e);
      }
    }, 3000);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTxLoading(true);
    setTxError('');

    try {
      const res = await api.wave.initiateDeposit({
        amount: parseFloat(amount),
        phone,
      }, token);

      setShowDepositModal(false);
      setTxLoading(false);

      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        startPolling(res.idInternal);
      }
    } catch (err: any) {
      setTxError(err.message || 'Erreur d\'initiation du dépôt');
      setTxLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTxLoading(true);
    setTxError('');

    try {
      const res = await api.wave.initiateWithdraw({
        amount: parseFloat(amount),
        phone,
      }, token);

      setShowWithdrawModal(false);
      setTxLoading(false);
      
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        startPolling(res.idInternal);
      }
    } catch (err: any) {
      setTxError(err.message || 'Erreur d\'initiation du retrait');
      setTxLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedStock) return;
    setTradeError('');
    setTradeSuccess('');
    setTradeLoading(true);
    try {
      await api.orders.create({
        type: tradeType,
        codeValeur: selectedStock.code,
        quantityRequested: parseInt(tradeQuantity),
        priceRequested: selectedStock.price
      }, token);

      setTradeSuccess(`Votre ordre de ${tradeType.toLowerCase()} de ${tradeQuantity} actions ${selectedStock.code} a été enregistré et mis en attente de validation par l'administrateur.`);
      
      // Refresh user balance, holdings, and orders
      await fetchData();
      setTradeQuantity('1');
    } catch (err: any) {
      setTradeError(err.message || "Une erreur est survenue lors de la soumission de l'ordre.");
    } finally {
      setTradeLoading(false);
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
      
      {/* Header avec Logo BAOU et Drapeau CI */}
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <span className="font-black tracking-wider text-md text-white">
            BAOU <span className="text-emerald-500 font-medium">FINANCE</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-slate-300">
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Bannière de Polling PawaPay */}
        {pendingTxId && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-emerald-400 animate-spin" />
              <div>
                <h4 className="font-bold text-white">Validation Mobile Money en cours...</h4>
                <p className="text-xs text-slate-400">Confirmation sur votre mobile requise. Statut actualisé automatiquement.</p>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-orange-500"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Solde Cash disponible</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white" id="balanceDisplay">
                  {cashWallet ? cashWallet.balanceTotal.toLocaleString() : '0'}
                </span>
                <span className="text-lg font-bold text-orange-500">{cashWallet?.currency}</span>
              </div>
              {cashWallet && cashWallet.balanceFrozen > 0 && (
                <span className="text-xs text-orange-400 mt-2 block">
                  🔒 Gelé (en traitement) : {cashWallet.balanceFrozen.toLocaleString()} XOF
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => setShowDepositModal(true)}
                id="depositBtn"
                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-2.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4" />
                Dépôt
              </button>
              <button 
                onClick={() => setShowWithdrawModal(true)}
                id="withdrawBtn"
                className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <ArrowDownLeft className="h-4 w-4" />
                Retrait
              </button>
            </div>
          </div>

          {/* Card Profil & KYC */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-white"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Statut Conformité KYC</span>
              <div className="flex items-center gap-2.5 mt-2">
                {user.kycStatus === 'APPROUVE' ? (
                  <>
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    <span className="text-md font-bold text-white">Compte Validé</span>
                  </>
                ) : user.kycStatus === 'REJETE' ? (
                  <>
                    <ShieldAlert className="h-7 w-7 text-rose-500" />
                    <span className="text-md font-bold text-white">Dossier Rejeté</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-7 w-7 text-orange-400 animate-pulse" />
                    <span className="text-md font-bold text-white" id="kycStatus">En attente d'étude</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Votre dossier KYC a été transmis avec vos pièces justificatives (CNI, Photo, Facture) à notre SGI partenaire.
              </p>
            </div>
            <div className="border-t border-slate-800/50 pt-4 text-[10px] text-slate-500 flex justify-between">
              <span>SGI : Société Générale</span>
              <span>Email : {user.email}</span>
            </div>
          </div>

          {/* Card Portefeuille Titres */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Portefeuille d'actions</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white">
                  {securities.reduce((acc, curr) => acc + (curr.quantity * curr.averageBuyPrice), 0).toLocaleString()}
                </span>
                <span className="text-lg font-bold text-emerald-500">XOF</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Suivi d'évolution connecté BRVM</span>
              </div>
            </div>
            <div className="border-t border-slate-800/50 pt-4 text-[10px] text-slate-500">
              Lignes de titres possédés : {securities.length}
            </div>
          </div>
        </div>

        {/* Bottom Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Section Gauche : Titres Boursiers possédés & Marché complet */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            
            {/* Tabs Marché / Holdings */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button 
                onClick={() => setActiveMarketTab('holdings')}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                  activeMarketTab === 'holdings' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mes Titres
              </button>
              <button 
                onClick={() => setActiveMarketTab('market')}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                  activeMarketTab === 'market' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Marché BRVM
              </button>
            </div>

            {activeMarketTab === 'holdings' ? (
              <div>
                <h3 className="font-extrabold text-white text-md mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Mes Actions Détenues</span>
                </h3>
                {securities.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-500">Aucune action achetée pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securities.map((sec, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-lg">
                        <div>
                          <span className="font-bold text-white text-xs block">{sec.codeValeur}</span>
                          <span className="text-[10px] text-slate-500">{sec.quantity} parts détenues</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white">{(sec.quantity * sec.averageBuyPrice).toLocaleString()} XOF</span>
                          <span className="text-[9px] text-slate-400 block">P.M.P: {sec.averageBuyPrice} F</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-extrabold text-white text-md mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-400" />
                  <span>Prix en Direct du Marché</span>
                </h3>
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {marketStocks.map((stock) => (
                    <div 
                      key={stock.code} 
                      onClick={() => setSelectedStock(stock)}
                      className="flex justify-between items-center p-3 bg-slate-950 border border-slate-850 hover:bg-slate-800/40 transition-colors rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 border border-slate-800 font-mono text-[10px] px-1.5 py-0.5 rounded text-white font-bold">{stock.code}</span>
                        <span className="text-xs text-slate-300 truncate max-w-[90px]">{stock.name}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-xs font-bold font-mono text-white block">{stock.price.toLocaleString()} F</span>
                          <span className={`text-[9px] font-bold block ${
                            stock.change > 0 ? 'text-emerald-400' : stock.change < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                        <Maximize2 className="h-3 w-3 text-slate-600 hover:text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Droite : Historique des transactions et des ordres */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              {/* Header avec Commutateur d'Onglets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                <h3 className="font-extrabold text-white text-md flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>Historique des Activités</span>
                </h3>
                <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveHistoryTab('payments')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeHistoryTab === 'payments'
                        ? 'bg-slate-900 text-white shadow'
                        : 'text-slate-550 hover:text-white'
                    }`}
                  >
                    Paiements Cash
                  </button>
                  <button
                    onClick={() => setActiveHistoryTab('orders')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeHistoryTab === 'orders'
                        ? 'bg-slate-900 text-white shadow'
                        : 'text-slate-550 hover:text-white'
                    }`}
                  >
                    Ordres d'actions BRVM
                  </button>
                </div>
              </div>

              {activeHistoryTab === 'payments' ? (
                // Table des Transactions (Paiements Cash)
                transactions.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-xs text-slate-500">Aucune transaction de paiement enregistrée.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Montant</th>
                          <th className="pb-3 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {transactions.map((tx, i) => (
                          <tr key={i} className="text-xs">
                            <td className="py-3.5 font-bold flex items-center gap-2">
                              {tx.type === 'DEPOT' ? (
                                <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded"><ArrowUpRight className="h-3 w-3" /></span>
                              ) : (
                                <span className="bg-rose-500/10 text-rose-400 p-1 rounded"><ArrowDownLeft className="h-3 w-3" /></span>
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
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                tx.status === 'SUCCES' 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : tx.status === 'ECHEC' 
                                  ? 'bg-rose-500/10 text-rose-400' 
                                  : 'bg-orange-500/10 text-orange-400 animate-pulse'
                              }`}>
                                {tx.status === 'SUCCES' ? 'Confirmé' : tx.status === 'ECHEC' ? 'Échoué' : 'En attente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                // Table des Ordres d'actions BRVM
                orders.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-xs text-slate-500">Aucun ordre boursier d'actions enregistré.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3">Ordre</th>
                          <th className="pb-3">Titre</th>
                          <th className="pb-3">Détails</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {orders.map((ord, i) => {
                          const isAchat = ord.type === 'ACHAT';
                          const totalVal = ord.quantityRequested * ord.priceRequested;
                          return (
                            <tr key={i} className="text-xs">
                              <td className="py-3.5 font-bold flex items-center gap-2">
                                {isAchat ? (
                                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px]">Achat</span>
                                ) : (
                                  <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[10px]">Vente</span>
                                )}
                              </td>
                              <td className="py-3.5">
                                <span className="bg-slate-950 text-white border border-slate-850 px-1.5 py-0.5 rounded font-mono font-bold">
                                  {ord.codeValeur}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-450 font-mono">
                                {ord.quantityRequested} x {ord.priceRequested.toLocaleString()} F
                              </td>
                              <td className="py-3.5 font-extrabold text-white">
                                {totalVal.toLocaleString()} XOF
                              </td>
                              <td className="py-3.5 text-right">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  ord.status === 'EXECUTE'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : ord.status === 'ANNULE'
                                    ? 'bg-rose-500/10 text-rose-400'
                                    : 'bg-orange-500/10 text-orange-400 animate-pulse'
                                }`}>
                                  {ord.status === 'EXECUTE'
                                    ? 'Exécuté'
                                    : ord.status === 'ANNULE'
                                    ? 'Annulé'
                                    : 'En attente admin'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Boîte Documents SGI */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg mt-6">
              <h3 className="font-extrabold text-white text-md flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-orange-500" />
                <span>Documents SGI Officiels</span>
              </h3>
              
              {myDocuments.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                  <p className="text-xs text-slate-500">Aucun document transmis par votre conseiller SGI.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myDocuments.map((doc, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-orange-500/30 transition-all">
                      <div>
                        <div className="font-bold text-xs text-white">{doc.title}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1">Transmis le {new Date(doc.createdAt).toLocaleDateString()}</div>
                      </div>
                      <a 
                        href={doc.fileData} 
                        download={doc.fileName}
                        className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Télécharger
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DEPOT */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Dépôt par Mobile Money</h3>
            <p className="text-slate-400 text-xs mb-6">Sélectionnez le réseau et rechargez vos fonds.</p>

            {txError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-4">
                {txError}
              </div>
            )}

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Montant (XOF)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="500"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>



              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">N° Mobile Money de débit</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="2250700000000"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-4 pr-10 py-2 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <Phone className="absolute right-3 top-2.5 h-4 w-4 text-slate-650" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  id="confirmDepositBtn"
                  disabled={txLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer flex justify-center items-center"
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
            <h3 className="text-lg font-bold text-white mb-2">Retrait par Mobile Money</h3>
            <p className="text-slate-400 text-xs mb-6">Retirez des fonds vers votre numéro mobile.</p>

            {txError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-4">
                {txError}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Montant (XOF)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="500"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>



              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">N° Mobile Money de crédit</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="2250700000000"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-4 pr-10 py-2 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <Phone className="absolute right-3 top-2.5 h-4 w-4 text-slate-655" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  id="confirmWithdrawBtn"
                  disabled={txLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer flex justify-center items-center"
                >
                  {txLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INFOS DE LA SOCIÉTÉ (Scraping du jour automatique) */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedStock(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="bg-slate-950 text-white font-mono text-sm px-2.5 py-1 rounded border border-slate-800">
                {selectedStock.code}
              </span>
              <div>
                <h3 className="text-lg font-black text-white">{selectedStock.name}</h3>
                <span className="text-xs text-slate-400">Détails boursiers d'aujourd'hui</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dernier Cours</span>
                <span className="text-2xl font-black text-white font-mono">{selectedStock.price.toLocaleString()} XOF</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${
                  selectedStock.change > 0 ? 'text-emerald-400' : selectedStock.change < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Volume Échangé (Titres)</span>
                <span className="text-xl font-black text-white font-mono">
                  {selectedStock.volumeShares ? selectedStock.volumeShares.toLocaleString() : '0'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Val. : {selectedStock.volumeXof ? selectedStock.volumeXof.toLocaleString() : '0'} XOF
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 col-span-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase block">Ouverture</span>
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {selectedStock.open ? selectedStock.open.toLocaleString() : selectedStock.price.toLocaleString()} F
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase block">Plus Haut</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {selectedStock.high ? selectedStock.high.toLocaleString() : selectedStock.price.toLocaleString()} F
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase block">Plus Bas</span>
                  <span className="text-sm font-bold font-mono text-rose-400">
                    {selectedStock.low ? selectedStock.low.toLocaleString() : selectedStock.price.toLocaleString()} F
                  </span>
                </div>
              </div>
            </div>

            {/* Panneau de Négociation d'Actions BRVM */}
            <div className="mt-6 border-t border-slate-800 pt-6 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Passer un Ordre Boursier</h4>

              {/* Onglets Achat / Vente */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setTradeType('ACHAT');
                    setTradeError('');
                    setTradeSuccess('');
                  }}
                  className={`py-2 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                    tradeType === 'ACHAT'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ACHETER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTradeType('VENTE');
                    setTradeError('');
                    setTradeSuccess('');
                  }}
                  className={`py-2 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                    tradeType === 'VENTE'
                      ? 'bg-rose-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  VENDRE
                </button>
              </div>

              {/* Alertes de statut KYC ou validation */}
              {user.kycStatus !== 'APPROUVE' ? (
                <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-xl">
                  ⚠️ <strong>Dossier non validé</strong> : Votre compte n'est pas encore approuvé par le service KYC. Vous ne pouvez pas encore négocier de titres.
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  {tradeError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                      {tradeError}
                    </div>
                  )}

                  {tradeSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                      {tradeSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Quantité de titres
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tradeQuantity}
                      onChange={(e) => {
                        setTradeQuantity(e.target.value);
                        setTradeError('');
                        setTradeSuccess('');
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm font-mono"
                    />
                  </div>

                  {/* Synthèse financière de l'ordre */}
                  {(() => {
                    const qty = parseInt(tradeQuantity) || 0;
                    const price = selectedStock.price;
                    const rawCost = qty * price;
                    const commission = rawCost * 0.015;
                    const totalCost = rawCost + commission;
                    const dispo = cashWallet ? cashWallet.balanceTotal - cashWallet.balanceFrozen : 0;
                    const ownedSec = securities.find((s) => s.codeValeur === selectedStock.code);
                    const ownedQty = ownedSec ? ownedSec.quantity : 0;
                    const isAchat = tradeType === 'ACHAT';

                    const hasFunds = dispo >= totalCost;
                    const hasStocks = ownedQty >= qty;

                    return (
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Valeur brute :</span>
                          <span className="font-mono text-white">{rawCost.toLocaleString()} XOF</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Frais SGI (1.5%) :</span>
                          <span className="font-mono text-white">{commission.toLocaleString()} XOF</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-slate-850 pt-2 text-slate-300">
                          <span>{isAchat ? 'Débit estimé :' : 'Gain estimé :'}</span>
                          <span className={`font-mono ${isAchat ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {totalCost.toLocaleString()} XOF
                          </span>
                        </div>

                        {/* Validations visuelles et blocages */}
                        <div className="border-t border-slate-850 pt-2 space-y-1">
                          {isAchat ? (
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500">Solde Cash dispo :</span>
                              <span className={`font-mono font-bold ${hasFunds ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {dispo.toLocaleString()} XOF
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500">Actions possédées :</span>
                              <span className={`font-mono font-bold ${hasStocks ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {ownedQty} titres
                              </span>
                            </div>
                          )}

                          {isAchat && !hasFunds && (
                            <div className="text-[10px] text-rose-500 font-bold block pt-1">
                              ❌ Solde cash disponible insuffisant pour couvrir cet achat.
                            </div>
                          )}

                          {!isAchat && !hasStocks && (
                            <div className="text-[10px] text-rose-500 font-bold block pt-1">
                              ❌ Vous ne possédez pas assez d'actions de ce titre.
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={
                            tradeLoading ||
                            (isAchat && !hasFunds) ||
                            (!isAchat && !hasStocks) ||
                            qty <= 0
                          }
                          className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer ${
                            isAchat
                              ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/25 disabled:text-emerald-500/50 text-slate-950'
                              : 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:bg-rose-500/25 disabled:text-rose-500/50 text-slate-950'
                          }`}
                        >
                          {tradeLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-slate-950"></div>
                          ) : isAchat ? (
                            'Soumettre l\'ordre d\'achat'
                          ) : (
                            'Soumettre l\'ordre de vente'
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-950 h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
