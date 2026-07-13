'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './providers';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown,
  ShieldCheck, 
  Search, 
  ChevronRight, 
  Globe, 
  Maximize2,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Lock,
  Mail,
  UserCheck
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

  // Navigation active tab
  const [activeSection, setActiveSection] = useState<'hero' | 'market' | 'login'>('hero');
  const [growthStep, setGrowthStep] = useState(1);

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

  // Sparkline generator (fictional trend lines based on stock change)
  const sparklinesCache = React.useRef<Record<string, string>>({});
  const getSparklinePath = (code: string, change: number) => {
    if (sparklinesCache.current[code]) return sparklinesCache.current[code];
    const points = [];
    let currentY = 40;
    points.push(`0,${currentY}`);
    for (let i = 1; i <= 5; i++) {
      const stepX = i * 20;
      const trend = change > 0 ? -5 : change < 0 ? 5 : 0;
      const randomOffset = Math.random() * 25 - 12.5;
      currentY = Math.max(10, Math.min(70, currentY + trend + randomOffset));
      points.push(`${stepX},${currentY}`);
    }
    const path = `M ${points.join(' L ')}`;
    sparklinesCache.current[code] = path;
    return path;
  };

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Load stocks and configure live interval
  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 5000);
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
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-orange-500 border-b-2 border-emerald-500"></div>
          <Logo className="absolute h-8 w-8 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden relative">
      
      {/* GRAPHISME CÔTE D'IVOIRE EN ARRIÈRE-PLAN (Lumières et lignes technologiques connectées) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
        
        {/* Silhouette de la Côte d'Ivoire en constellation de nœuds connectés (SVG) */}
        <svg className="absolute right-[5%] top-[15%] w-[450px] h-[450px] opacity-10 text-emerald-500 hidden xl:block" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          {/* Lignes de constellation de la carte CI */}
          <path d="M30 15 L50 20 L75 12 L85 45 L78 80 L52 92 L20 82 L15 48 Z" strokeDasharray="2,2" />
          <path d="M30 15 L45 45 L52 92" />
          <path d="M75 12 L45 45 L20 82" />
          <path d="M15 48 L45 45 L85 45" />
          {/* Cercles représentant Abidjan, Yamoussoukro, Bouaké, San Pedro, Korhogo */}
          <circle cx="78" cy="80" r="3" fill="#ff8200" className="animate-pulse" /> {/* Abidjan */}
          <circle cx="50" cy="65" r="2" fill="#ffffff" /> {/* Yamoussoukro */}
          <circle cx="52" cy="48" r="2.5" fill="#009e60" /> {/* Bouaké */}
          <circle cx="32" cy="85" r="2" fill="#ff8200" /> {/* San Pedro */}
          <circle cx="48" cy="22" r="2" fill="#009e60" /> {/* Korhogo */}
        </svg>
      </div>

      {/* Barre de navigation */}
      <nav className="border-b border-slate-900 bg-slate-900/40 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10 cursor-pointer" />
          <span className="text-xl font-black tracking-wider text-white">
            BAOU <span className="text-emerald-500 font-medium">FINANCE</span>
          </span>
        </div>

        {/* Menu de navigation pour naviguer sur la page unique */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold">
          <button 
            onClick={() => setActiveSection('hero')}
            className={`transition-colors cursor-pointer ${activeSection === 'hero' ? 'text-orange-400' : 'text-slate-400 hover:text-white'}`}
          >
            Présentation
          </button>
          <button 
            onClick={() => setActiveSection('market')}
            className={`transition-colors cursor-pointer ${activeSection === 'market' ? 'text-orange-400' : 'text-slate-400 hover:text-white'}`}
          >
            Marché BRVM
          </button>
          <button 
            onClick={() => setActiveSection('login')}
            className={`px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-600 transition-colors cursor-pointer`}
          >
            Espace Investisseur
          </button>
        </div>

        {/* Badge BRVM mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Live BRVM</span>
        </div>
      </nav>

      {/* Contenu principal selon la section active */}
      <main className="flex-1 z-10 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col justify-center">
        
        {activeSection === 'hero' && (
          <div className="flex flex-col lg:flex-row items-center gap-12 py-8 md:py-16">
            
            {/* Colonne d'accroche Hero */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                <span>Fintech Agréée & Sécurisée de Côte d'Ivoire</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white">
                Faites fructifier votre épargne dans les plus grands{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-emerald-400">
                  titres de la BRVM
                </span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Achetez des actions Sonatel, CIE, Solibra, SGCI et bien d'autres directement en ligne. Approvisionnez votre compte via Orange Money, MTN, Moov ou Wave avec la passerelle ultra-sécurisée PawaPay.
              </p>

              {/* Ligne drapeau de Côte d'Ivoire graphique */}
              <div className="flex justify-center lg:justify-start gap-1 h-2 w-24 rounded-full overflow-hidden">
                <div className="bg-[#ff8200] w-1/3"></div>
                <div className="bg-[#ffffff] w-1/3"></div>
                <div className="bg-[#009e60] w-1/3"></div>
              </div>

              {/* Boutons d'actions Hero */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <button 
                  onClick={() => setActiveSection('login')}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-emerald-500 hover:opacity-90 text-slate-950 font-black py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <span>Commencer à investir</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setActiveSection('market')}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <span>Consulter le Marché</span>
                </button>
              </div>

              {/* Stats Keynotes */}
              <div className="grid grid-cols-3 gap-4 pt-8 max-w-md mx-auto lg:mx-0 border-t border-slate-900">
                <div className="text-center lg:text-left">
                  <span className="text-2xl font-black text-white block">0%</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Frais de garde</span>
                </div>
                <div className="text-center lg:text-left">
                  <span className="text-2xl font-black text-emerald-400 block">+12.4%</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Rendement moyen</span>
                </div>
                <div className="text-center lg:text-left">
                  <span className="text-2xl font-black text-orange-400 block">4 Opérateurs</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Mobile Money</span>
                </div>
              </div>
            </div>

            {/* Colonne de droite : Aperçu graphique animé et Logo 3D */}
            <div className="flex-1 w-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-orange-500/10 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              
              {/* Carte Graphique Principale (Bloomberg Style) */}
              <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8" />
                    <span className="font-black text-xs text-white tracking-widest">BAOU INTERACTIVE</span>
                  </div>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded">
                    Temps Réel
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Indice Synthétique CI-BRVM</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">218.45</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +1.85%
                    </span>
                  </div>
                </div>

                {/* mini graphique boursier animé SVG */}
                <div className="h-32 w-full bg-slate-950/80 rounded-2xl border border-slate-850 p-4 flex flex-col justify-between relative overflow-hidden">
                  <svg className="w-full h-24 text-emerald-500/20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,80 L20,60 L40,70 L60,45 L80,35 L100,15 L100,100 L0,100 Z" fill="currentColor" />
                    <path d="M0,80 L20,60 L40,70 L60,45 L80,35 L100,15" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  </svg>
                  <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[9px] font-bold text-slate-500">
                    <span>09:00</span>
                    <span>Yamoussoukro GMT</span>
                    <span>17:00</span>
                  </div>
                </div>

                {/* 2 lignes d'actions phares */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-850 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold text-[9px] px-1.5 py-0.5 rounded">SNTS</span>
                      <span className="text-xs font-bold text-slate-300">Sonatel</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">+3.68%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-850 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] px-1.5 py-0.5 rounded">CIEC</span>
                      <span className="text-xs font-bold text-slate-300">CIE CI</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400">-3.37%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION ÉLÉPHANT DE CROISSANCE CÔTE D'IVOIRE */}
        {activeSection === 'hero' && (
          <div className="mt-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>

            <div className="flex-1 space-y-6">
              <div className="space-y-1">
                <span className="text-orange-400 font-bold uppercase tracking-wider text-xs">Simulateur d'investissement</span>
                <h3 className="text-3xl font-black text-white">Une Croissance Solide comme un Éléphant</h3>
                <p className="text-xs text-slate-400">
                  Déplacez le curseur pour voir grandir la force de votre investissement et l'Éléphant de Côte d'Ivoire au fil des années.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950 p-6 rounded-2xl border border-slate-850">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Horizon d'investissement</span>
                  <span className="text-emerald-400 text-sm font-black">{growthStep} {growthStep > 1 ? 'ans' : 'an'}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={growthStep}
                  onChange={(e) => setGrowthStep(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[10px] text-slate-650 font-bold">
                  <span>1 an</span>
                  <span>5 ans</span>
                  <span>10 ans</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Capital Initial</span>
                  <span className="text-lg font-mono font-bold text-white">1,000,000 F XOF</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valeur Future Estimée (12.4%)</span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    {Math.round(1000000 * Math.pow(1 + 0.124, growthStep)).toLocaleString()} F XOF
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Formule de calcul des intérêts composés : \(V_f = V_i \times (1 + r)^t\), avec un taux moyen annuel \(r = 12.4\%\).
              </p>
            </div>

            <div className="w-full lg:w-[350px] flex flex-col items-center justify-center min-h-[300px] bg-slate-950/40 border border-slate-850 rounded-3xl p-6 relative">
              <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-6">Visualisation de la croissance</span>
              
              <div className="h-48 flex items-end justify-center w-full">
                <svg 
                  viewBox="0 0 200 200" 
                  className="transition-all duration-500 ease-out" 
                  style={{ 
                    transform: `scale(${0.6 + (growthStep * 0.07)})`,
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <defs>
                    <linearGradient id="elephantBody" x1="80" y1="75" x2="170" y2="140" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ff8200" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#009e60" />
                    </linearGradient>
                    <linearGradient id="elephantOreille" x1="50" y1="80" x2="80" y2="120" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ff8200" />
                      <stop offset="100%" stopColor="#009e60" opacity="0.6" />
                    </linearGradient>
                  </defs>

                  <path d="M 95 85 C 75 65, 65 95, 85 125 C 95 135, 105 125, 105 105 Z" fill="url(#elephantOreille)" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
                  <path d="M 100 80 L 170 75 L 190 100 L 180 145 L 160 145 L 155 115 L 125 115 L 120 145 L 100 145 Z" fill="url(#elephantBody)" stroke="#ffffff" strokeWidth="1.5" />
                  <path d="M 105 80 C 105 60, 85 60, 80 80 C 75 90, 95 100, 105 95 Z" fill="url(#elephantBody)" stroke="#ffffff" strokeWidth="1" />
                  
                  <path 
                    d="M 80 80 C 65 75, 55 60, 60 45 C 62 40, 68 40, 65 50 C 62 60, 70 70, 80 75 Z" 
                    fill="url(#elephantBody)" 
                    stroke="#ffffff" 
                    strokeWidth="1" 
                    style={{ 
                      transform: `rotate(${-growthStep * 3.5}deg)`, 
                      transformOrigin: '80px 80px',
                      transition: 'transform 0.5s ease-out'
                    }}
                  />
                  
                  <path d="M 82 88 L 68 95 L 80 92 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                  <circle cx="90" cy="74" r="2.5" fill="#ff8200" className="animate-pulse" />
                </svg>
              </div>

              <div className="mt-4 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Croissance de l'Éléphant</span>
                <span className="text-xs font-black text-orange-400">{(growthStep * 10) + 100}% de puissance</span>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'market' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-2">
                  <span className="w-2 h-7 bg-gradient-to-b from-orange-500 via-white to-emerald-500 rounded-full"></span>
                  <span>Marché Boursier de la BRVM</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Recherchez une société cotée de la BRVM et consultez ses cours d'ouverture, plus haut, plus bas et volumes.
                </p>
              </div>

              {/* Recherche */}
              <div className="relative w-full md:max-w-xs">
                <input 
                  type="text" 
                  placeholder="Rechercher par code ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-650" />
              </div>
            </div>

            {marketLoading ? (
              <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 border-b-2 border-orange-500"></div>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-sm">Aucun titre boursier correspondant à votre recherche.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800/60 rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-850 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60 p-4">
                      <th className="p-4">Code</th>
                      <th className="p-4">Nom de la Société</th>
                      <th className="p-4">Tendance</th>
                      <th className="p-4">Cours du jour (XOF)</th>
                      <th className="p-4">Variation</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredStocks.map((stock) => {
                      const isUp = stock.change > 0;
                      const isDown = stock.change < 0;
                      return (
                        <tr 
                          key={stock.code} 
                          onClick={() => setSelectedStock(stock)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer text-sm"
                        >
                          <td className="p-4">
                            <span className="bg-slate-950 border border-slate-800 text-white font-mono text-xs px-2.5 py-1 rounded font-black">
                              {stock.code}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-200">{stock.name}</td>
                          <td className="p-4">
                            {/* mini sparkline graphique en direct */}
                            <svg className="w-20 h-8 text-slate-500" viewBox="0 0 100 80">
                              <path 
                                d={getSparklinePath(stock.code, stock.change)}
                                fill="none"
                                stroke={isUp ? '#10b981' : isDown ? '#f43f5e' : '#64748b'}
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                          </td>
                          <td className="p-4 font-mono font-black text-white text-base">
                            {stock.price.toLocaleString()} F
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                              isUp 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                : isDown 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isUp ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : isDown ? (
                                <TrendingDown className="h-3.5 w-3.5" />
                              ) : null}
                              <span>{isUp ? '+' : ''}{stock.change.toFixed(2)}%</span>
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStock(stock);
                              }}
                              className="bg-slate-950 hover:bg-slate-850 border border-slate-850 px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-emerald-400 flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                            >
                              Détails <Maximize2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === 'login' && (
          <div className="max-w-md w-full mx-auto py-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              {/* Bannière de liseré tricolore en haut */}
              <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>

              <div className="mb-6 space-y-1">
                <h3 className="text-2xl font-black text-white">Espace Investisseur</h3>
                <p className="text-xs text-slate-400">Connectez-vous pour acheter et vendre vos actions BRVM.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Adresse Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      id="phoneOrEmail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: jean@koffi.ci"
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-10 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                    />
                    <Mail className="absolute right-3.5 top-3.5 h-4.5 w-4.5 text-slate-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mot de passe</label>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-10 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                    />
                    <Lock className="absolute right-3.5 top-3.5 h-4.5 w-4.5 text-slate-600" />
                  </div>
                </div>

                <button
                  type="submit"
                  id="loginBtn"
                  disabled={loginLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer text-sm mt-6"
                >
                  {loginLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <UserCheck className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-800/60 text-center text-xs text-slate-400">
                Pas encore de compte ?{' '}
                <Link href="/register" className="text-orange-400 hover:text-orange-300 font-extrabold transition-colors">
                  Créez votre dossier KYC ici
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pied de page tricolore Côte d'Ivoire */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur py-8 px-6 text-center text-xs text-slate-500 space-y-3 z-10">
        <div className="flex justify-center items-center gap-2">
          <Logo className="h-5 w-5" />
          <span className="font-extrabold tracking-wider text-slate-400">BAOU FINANCE CI</span>
        </div>
        <p>Agrément CREPMF n° SGI-22507 | Plateforme conforme aux exigences de l'UEMOA.</p>
        <div className="flex justify-center gap-1.5 h-1 w-16 mx-auto rounded-full overflow-hidden">
          <div className="bg-[#ff8200] w-1/3"></div>
          <div className="bg-[#ffffff] w-1/3"></div>
          <div className="bg-[#009e60] w-1/3"></div>
        </div>
      </footer>

      {/* MODAL INFOS DE LA SOCIÉTÉ (Scraping du jour automatique) */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-250">
            {/* Dégradé décoratif tricolore en filigrane */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>

            <button 
              onClick={() => setSelectedStock(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-full bg-slate-950/40"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 mt-2">
              <span className="bg-slate-950 text-white font-mono text-xs px-2.5 py-1.5 rounded border border-slate-800 font-black">
                {selectedStock.code}
              </span>
              <div>
                <h3 className="text-xl font-black text-white">{selectedStock.name}</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Informations Boursières BRVM</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Box Prix */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Dernier Cours de Clôture</span>
                <span className="text-2xl font-black text-white font-mono">{selectedStock.price.toLocaleString()} XOF</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-extrabold ${
                  selectedStock.change > 0 ? 'text-emerald-400' : selectedStock.change < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {selectedStock.change > 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                </span>
              </div>

              {/* Box Volume */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Volume Échangé (Titres)</span>
                <span className="text-xl font-black text-white font-mono">
                  {selectedStock.volumeShares ? selectedStock.volumeShares.toLocaleString() : '0'}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Val. : {selectedStock.volumeXof ? selectedStock.volumeXof.toLocaleString() : '0'} XOF
                </span>
              </div>

              {/* Box Variations du jour */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 col-span-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase block">Ouverture</span>
                  <span className="text-xs font-bold font-mono text-slate-200">
                    {selectedStock.open ? selectedStock.open.toLocaleString() : selectedStock.price.toLocaleString()} F
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase block">Plus Haut</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {selectedStock.high ? selectedStock.high.toLocaleString() : selectedStock.price.toLocaleString()} F
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase block">Plus Bas</span>
                  <span className="text-xs font-bold font-mono text-rose-400">
                    {selectedStock.low ? selectedStock.low.toLocaleString() : selectedStock.price.toLocaleString()} F
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4.5 mt-6 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Ce titre est coté sur le marché financier de la BRVM. L'achat de cette action nécessite d'avoir un compte validé par le régulateur (statut KYC approuvé) et des fonds disponibles.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedStock(null)}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-850 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button 
                onClick={() => {
                  setSelectedStock(null);
                  setActiveSection('login');
                }}
                className="bg-gradient-to-r from-orange-500 to-emerald-500 hover:opacity-90 px-4 py-2 rounded-xl text-xs font-black text-slate-950 transition-opacity cursor-pointer"
              >
                Acheter ce titre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
