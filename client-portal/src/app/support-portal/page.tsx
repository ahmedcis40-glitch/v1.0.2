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
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';

function SupportPortalContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'ADMIN') {
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
      </header>

      {/* Barre d'outils Logs */}
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

      {/* Contenu Logs */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {logsLoading ? (
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
