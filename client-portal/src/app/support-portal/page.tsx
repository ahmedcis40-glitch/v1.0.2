'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../providers';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import { 
  Wrench, 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Database,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

function SupportPortalContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [supportTab, setSupportTab] = useState<'logs' | 'docs'>('logs');

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
        router.push('/admin-portal/login');
      } else {
        fetchLogs();
      }
    }
  }, [user, loading, router]);

  const fetchLogs = async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const data = await api.support.getLogs(token);
      setLogs(data);
    } catch (e) {
      console.error("Erreur lors de la récupération des logs support:", e);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.context && log.context.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.stack && log.stack.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header Support */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <span className="text-xl font-black tracking-wider text-white">
            BAOU <span className="text-emerald-500 font-medium">SUPPORT</span>
          </span>
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Logs Collector
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin-portal/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-xs font-bold text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-orange-400" />
            <span>Retour Back-office</span>
          </Link>
        </div>
      </header>      {/* Sélecteur d'onglets de Support */}
      <div className="max-w-7xl w-full mx-auto px-6 pt-6 flex border-b border-slate-900">
        <button
          onClick={() => setSupportTab('logs')}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            supportTab === 'logs' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Journal d'incidents & Bugs</span>
        </button>
        <button
          onClick={() => setSupportTab('docs')}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            supportTab === 'docs' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Manuel & Connaissances du Projet</span>
        </button>
      </div>

      {/* Barre d'outils Logs (visible uniquement sur l'onglet logs) */}
      {supportTab === 'logs' && (
        <div className="max-w-7xl w-full mx-auto px-6 pt-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Wrench className="h-5 w-5 text-emerald-400" />
              <span>Journal d'incidents & de Bugs</span>
            </h2>
            <p className="text-xs text-slate-400">Consultez en temps réel les stack-traces des erreurs capturées automatiquement par NestJS.</p>
          </div>

          <div className="flex gap-3 shrink-0">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Rechercher une erreur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-650" />
            </div>

            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Actualiser la liste"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${logsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Contenu de Support */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {supportTab === 'logs' ? (
          logsLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-slate-850 rounded-2xl">
              <p className="text-slate-500 text-sm">Aucun incident ou bug enregistré en base de données.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const isError = log.level === 'ERROR';
                const isWarn = log.level === 'WARN';
                const isExpanded = expandedLogId === log.id;

                return (
                  <div 
                    key={log.id}
                    className={`bg-slate-900 border rounded-2xl p-5 space-y-3.5 transition-all ${
                      isExpanded ? 'border-slate-750' : 'border-slate-850/60 hover:border-slate-800'
                    }`}
                  >
                    <div 
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="flex justify-between items-start gap-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        {isError ? (
                          <div className="h-9 w-9 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                        ) : isWarn ? (
                          <div className="h-9 w-9 bg-orange-500/10 border border-orange-500/20 text-orange-450 rounded-xl flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="h-9 w-9 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                            <Info className="h-5 w-5" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="font-bold text-white text-xs md:text-sm">{log.message}</div>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                            <span className="bg-slate-950 px-2 py-0.5 rounded font-mono text-[9px]">
                              Ctx: {log.context || 'Global'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button className="text-slate-500 hover:text-white p-1">
                        {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                      </button>
                    </div>

                    {isExpanded && log.stack && (
                      <div className="bg-slate-950 border border-slate-850/60 rounded-xl p-4 overflow-x-auto text-[10px] font-mono text-rose-400 leading-relaxed max-h-[300px]">
                        <pre>{log.stack}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Onglet 2 : Base de Connaissance du Projet */
          <div className="space-y-6 bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 text-xs">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-orange-400" />
                <span>Base de Connaissance & Spécifications du Projet</span>
              </h2>
              <p className="text-xs text-slate-400">Toutes les informations et architectures du projet BAOU FINANCE destinées aux agents du support client.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* Architecture Générale */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="h-4 w-4" />
                  <span>Architecture & Services</span>
                </h3>
                <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                  <p>Le projet est composé de 4 grandes briques logicielles interconnectées :</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-450 font-mono text-[11px]">
                    <li><strong>Backend (NestJS)</strong> : Port 3000. Utilise Prisma ORM + PostgreSQL (Supabase) pour stocker les investisseurs, portefeuilles et transactions.</li>
                    <li><strong>Client Portal (Next.js)</strong> : Port 8080. Espace Web investisseur (trading en direct) et Back-office administrateur financier.</li>
                    <li><strong>Mobile App (Expo)</strong> : Client iOS/Android avec barre de navigation à 3 onglets (Portefeuille, Bourse, Historique).</li>
                    <li><strong>Mobile Simulator (Vite)</strong> : Port 8085. Simulateur d'application boursière directement accessible dans le navigateur.</li>
                  </ul>
                </div>
              </div>

              {/* Passerelle de Paiement Wave */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  <span>Passerelle Wave Business (C2B)</span>
                </h3>
                <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                  <p>L'intégration de la passerelle Wave Côte d'Ivoire fonctionne de façon autonome :</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-450">
                    <li><strong>Dépôt direct</strong> : Redirection du client vers son application Wave via son lien marchand statique <code>https://pay.wave.com/m/M_ci_XRkfDq_9M8GP/c/ci/?src=p</code>.</li>
                    <li><strong>Crédit Instantané</strong> : Les dépôts n'ont plus besoin d'être validés par l'admin ; le crédit s'effectue automatiquement de façon synchrone en base de données à l'initiation !</li>
                    <li><strong>Retraits</strong> : Débit instantané et blocage du solde (fonds gelés), suivi de la validation manuelle ou automatique du transfert.</li>
                  </ul>
                </div>
              </div>

              {/* Comptes & Identifiants de Test */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Identifiants d'Administration & Tests</span>
                </h3>
                <div className="text-xs text-slate-400 space-y-2 font-mono text-[11px] leading-relaxed">
                  <p className="font-sans text-xs text-slate-400 font-bold text-slate-350">Pour tester le back-office d'administration et les incidents :</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-450">
                    <li><strong>Portail d'Administration</strong> : <a href="http://localhost:8080/admin-portal" target="_blank" rel="noreferrer" className="text-orange-400 underline">/admin-portal</a></li>
                    <li><strong>Email Admin</strong> : admin@sgi.ci</li>
                    <li><strong>Mot de passe</strong> : password123</li>
                    <li><strong>Support Logs</strong> : Accessible aux comptes ADMIN et SUPPORT via <a href="/support-portal" className="text-orange-400 underline">/support-portal</a></li>
                  </ul>
                </div>
              </div>

              {/* KYC & Inscription Client */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Création de Compte & KYC</span>
                </h3>
                <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                  <p>Règles et contrôles de conformité KYC lors de l'enregistrement :</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-450">
                    <li><strong>Documents requis</strong> : Pièce d'Identité (Recto + Verso distincts), Photo de Profil (Selfie) et Justificatif de Domicile.</li>
                    <li><strong>Stockage Base64</strong> : Les documents chargés sont encodés en Base64 côté client et stockés de façon autonome dans la base PostgreSQL.</li>
                    <li><strong>WhatsApp</strong> : Le numéro de téléphone WhatsApp de l'investisseur est requis pour l'envoi automatique de reçus financiers.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SupportPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-950 h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    }>
      <SupportPortalContent />
    </Suspense>
  );
}
