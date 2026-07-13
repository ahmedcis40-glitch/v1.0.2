'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './providers';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  TrendingUp, 
  TrendingDown,
  ShieldCheck, 
  HelpCircle, 
  Search, 
  ChevronRight, 
  Globe, 
  Maximize2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

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

export default function Home() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  // Connection states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Market states
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Load stocks and configure live interval
  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 5000); // Mettre à jour toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      const data = await api.market.getStocks();
      setStocks(data);
    } catch (e) {
      console.warn("Échec du chargement du marché.");
    } finally {
      setMarketLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);
    try {
      await login({ phoneOrEmail: email, password });
    } catch (err: any) {
      setError(err.message || 'Identifiants de connexion invalides');
      setLoginLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => 
    stock.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100">
      
      {/* Barre de navigation simplifiée */}
      <nav className="border-b border-slate-900 bg-slate-900/40 backdrop-blur sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <span className="text-xl font-black tracking-wider text-white">
            BAOU <span className="text-emerald-500 font-medium">FINANCE</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Marché BRVM Ouvert</span>
        </div>
      </nav>

      {/* Hero & Section Principale */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Colonne Gauche : Le Tableau des Cours de la BRVM */}
        <div className="flex-1 w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-orange-500 via-white to-emerald-500 rounded-full"></span>
                <span>Cours des Actions BRVM</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">Données récupérées en direct de la bourse officielle.</p>
            </div>
            
            {/* Barre de recherche */}
            <div className="relative max-w-xs">
              <input 
                type="text" 
                placeholder="Rechercher une société..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
            </div>
          </div>

          {marketLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-500">Aucune société trouvée pour "{searchQuery}".</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[500px] border border-slate-800/40 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50 sticky top-0 z-10">
                    <th className="p-3">Société</th>
                    <th className="p-3">Dernier (XOF)</th>
                    <th className="p-3">Variation</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredStocks.map((stock) => (
                    <tr 
                      key={stock.code} 
                      onClick={() => setSelectedStock(stock)}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer text-sm"
                    >
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-950 text-white font-mono text-xs px-2 py-0.5 rounded border border-slate-800">
                            {stock.code}
                          </span>
                          <span className="text-slate-200 text-xs hidden md:inline truncate max-w-[180px]">
                            {stock.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        {stock.price.toLocaleString()} F
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          stock.change > 0 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : stock.change < 0 
                            ? 'bg-rose-500/10 text-rose-400' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {stock.change > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : stock.change < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          <span>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStock(stock);
                          }}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 justify-end ml-auto"
                        >
                          Infos <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Colonne Droite : Le Connexion & Onboarding */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          
          {/* Card Connexion */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Espace Connexion</h3>
              <p className="text-xs text-slate-400">Accédez à votre compte pour acheter des actions.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Adresse Email</label>
                <input
                  type="email"
                  id="phoneOrEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: jean@koffi.ci"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <button
                type="submit"
                id="loginBtn"
                disabled={loginLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50 text-slate-950 font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer text-sm"
              >
                {loginLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Nouveau sur Baou Finance ?{' '}
              <Link href="/register" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Card Drapeau de la Côte d'Ivoire graphique */}
          <div className="bg-gradient-to-r from-orange-500/10 via-slate-900/50 to-emerald-500/10 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Fintech Côte d'Ivoire</h4>
              <p className="text-[11px] text-slate-400">Première plateforme d'investissement boursier locale.</p>
            </div>
            <div className="flex gap-1 h-8 w-12 shrink-0 border border-slate-800/80 rounded-md overflow-hidden shadow">
              <div className="bg-[#ff8200] w-1/3"></div>
              <div className="bg-[#ffffff] w-1/3"></div>
              <div className="bg-[#009e60] w-1/3"></div>
            </div>
          </div>
        </div>
      </div>

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
                <span className="text-xs text-slate-400">Informations boursières du jour</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Box Prix */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dernier Cours</span>
                <span className="text-2xl font-black text-white font-mono">{selectedStock.price.toLocaleString()} XOF</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${
                  selectedStock.change > 0 ? 'text-emerald-400' : selectedStock.change < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                </span>
              </div>

              {/* Box Volume */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Volume Échangé (Titres)</span>
                <span className="text-xl font-black text-white font-mono">
                  {selectedStock.volumeShares ? selectedStock.volumeShares.toLocaleString() : '0'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Val. : {selectedStock.volumeXof ? selectedStock.volumeXof.toLocaleString() : '0'} XOF
                </span>
              </div>

              {/* Box Variations du jour */}
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

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mt-6 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Agréé par la CREPMF. Pour acheter ces titres, connectez-vous ou créez un compte Baou Finance et passez votre ordre en 2 clics avec votre SGI.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
