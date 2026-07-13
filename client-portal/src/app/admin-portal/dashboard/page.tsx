'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../providers';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Coins, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  FileText, 
  Search,
  Download,
  Calendar,
  Layers,
  Wrench
} from 'lucide-react';
import Link from 'next/link';

function AdminDashboardContent() {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();

  // Core Admin States
  const [activeTab, setActiveTab] = useState<'reporting' | 'kyc' | 'orders' | 'transactions' | 'incidents'>('reporting');
  const [reporting, setReporting] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any>(null);
  
  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'DEPOT' | 'RETRAIT'>('ALL');
  const [txStatusFilter, setTxStatusFilter] = useState<'ALL' | 'SUCCES' | 'ECHEC' | 'EN_COURS'>('ALL');

  // Interactive Operations States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [priceRealInput, setPriceRealInput] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/admin-portal/login');
      } else {
        fetchAllData();
      }
    }
  }, [user, loading, router]);

  const fetchAllData = async () => {
    if (!token) return;
    try {
      const [repData, usersData, ordersData, txsData, incData] = await Promise.all([
        api.admin.getReporting(token),
        api.admin.getUsers(token),
        api.admin.getOrders(token),
        api.admin.getTransactions(token),
        api.admin.getIncidents(token)
      ]);
      
      setReporting(repData);
      setUsers(usersData);
      setOrders(ordersData);
      setTransactions(txsData);
      setIncidents(incData);
    } catch (e) {
      console.error("Erreur de chargement des données d'administration :", e);
    }
  };

  // Traiter la validation/rejet KYC
  const handleKycValidation = async (userId: string, status: 'APPROUVE' | 'REJETE') => {
    if (!token) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.admin.updateKyc(userId, status, token);
      setSelectedUser(null);
      await fetchAllData();
    } catch (e: any) {
      setActionError(e.message || "Erreur lors de la mise à jour du KYC");
    } finally {
      setActionLoading(false);
    }
  };

  // Traiter la validation/annulation de l'ordre
  const handleOrderProcess = async (orderId: string, status: 'EXECUTE' | 'ANNULE') => {
    if (!token) return;
    setActionLoading(true);
    setActionError('');
    try {
      const priceReal = priceRealInput ? parseFloat(priceRealInput) : null;
      await api.admin.processOrder(orderId, status, priceReal, token);
      setSelectedOrder(null);
      setPriceRealInput('');
      await fetchAllData();
    } catch (e: any) {
      setActionError(e.message || "Erreur lors du traitement de l'ordre");
    } finally {
      setActionLoading(false);
    }
  };

  // Exporter en CSV
  const handleExportCSV = () => {
    const headers = ['ID Transaction', 'Utilisateur', 'Type', 'Montant', 'Statut', 'Date Création'];
    const rows = filteredTransactions.map(tx => [
      tx.idInternal,
      tx.User?.email || 'Inconnu',
      tx.type,
      tx.amount,
      tx.status,
      new Date(tx.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporting_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtres Transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.idInternal.toLowerCase().includes(txSearch.toLowerCase()) || 
                          (tx.User?.email && tx.User.email.toLowerCase().includes(txSearch.toLowerCase()));
    const matchesType = txTypeFilter === 'ALL' || tx.type === txTypeFilter;
    const matchesStatus = txStatusFilter === 'ALL' || tx.status === txStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtres Utilisateurs
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.lastName.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header Back-office */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <span className="text-xl font-black tracking-wider text-white">
            BAOU <span className="text-orange-500 font-medium">CONSOLE</span>
          </span>
          <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Admin Mode
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/support-portal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <Wrench className="h-4 w-4 text-emerald-400" />
            <span>Portail Support</span>
          </Link>
          <div className="hidden md:block text-right">
            <span className="text-xs font-bold text-white block">{user?.firstName} {user?.lastName}</span>
            <span className="text-[9px] text-slate-500 font-mono block">{user?.email}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-850 rounded-xl transition-colors cursor-pointer text-slate-450"
            title="Se déconnecter"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Barre d'onglets de navigation */}
      <div className="max-w-7xl w-full mx-auto px-6 pt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('reporting')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'reporting' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Reporting & Indicateurs</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'kyc' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Validation KYC ({users.filter(u => u.kycStatus === 'EN_ATTENTE_VALIDATION').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'orders' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Validation Ordres ({orders.filter(o => o.status === 'EN_ATTENTE').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'transactions' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>Suivi Transactions ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'incidents' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Litiges & Alertes ({incidents ? incidents.failedTransactions.length + incidents.stuckTransactions.length : 0})</span>
        </button>
      </div>

      {/* Contenu principal du dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Onglet 1 : Reporting & Statistiques */}
        {activeTab === 'reporting' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1 */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Total Clients</span>
                <span className="text-3xl font-black text-white block">
                  {reporting ? reporting.clientsCount.toLocaleString() : '...'}
                </span>
                <span className="text-[10px] text-slate-500 block">Sur {reporting ? reporting.usersCount.toLocaleString() : '...'} comptes enregistrés</span>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900 border border-slate-855 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Volume Dépôts</span>
                <span className="text-3xl font-black text-emerald-450 block">
                  {reporting ? reporting.totalDeposits.toLocaleString() : '...'} F
                </span>
                <span className="text-[10px] text-slate-500 block">Dépôts réussis validés</span>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Volume Retraits</span>
                <span className="text-3xl font-black text-indigo-405 block">
                  {reporting ? reporting.totalWithdraws.toLocaleString() : '...'} F
                </span>
                <span className="text-[10px] text-slate-500 block">Retraits réussis effectués</span>
              </div>

              {/* Card 4 */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Taux d'Échec PawaPay</span>
                <span className="text-3xl font-black text-rose-400 block">
                  {reporting ? `${reporting.failureRate}%` : '...'}
                </span>
                <span className="text-[10px] text-slate-500 block">Sur {reporting ? reporting.totalTransactions.toLocaleString() : '...'} paiements initiés</span>
              </div>

            </div>

            {/* Drapeau CI Stylisé en bas */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-white">Console d'administration financière</h3>
                <p className="text-xs text-slate-400">Suivez l'activité boursière et traitez les transactions de la passerelle PawaPay en temps réel.</p>
              </div>
              <div className="flex gap-1 h-3 w-32 rounded-full overflow-hidden shrink-0">
                <div className="bg-[#ff8200] w-1/3"></div>
                <div className="bg-[#ffffff] w-1/3"></div>
                <div className="bg-[#009e60] w-1/3"></div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 2 : Validation KYC */}
        {activeTab === 'kyc' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Vérification de l'Onboarding client</h3>
                <p className="text-xs text-slate-400">Validez les documents légaux d'inscription des nouveaux investisseurs.</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-orange-500"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-650" />
              </div>
            </div>

            {/* Erreur opérationnelle */}
            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {actionError}
              </div>
            )}

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Client</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">SGI Associée</th>
                    <th className="p-4">Statut KYC</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{u.phone}</td>
                      <td className="p-4 font-bold text-slate-400">{u.sgiPartenaire || 'Aucune'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.kycStatus === 'APPROUVE' 
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' 
                            : u.kycStatus === 'REJETE'
                            ? 'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                            : 'bg-orange-500/10 text-orange-450 border border-orange-500/15'
                        }`}>
                          {u.kycStatus === 'APPROUVE' ? 'Approuvé' : u.kycStatus === 'REJETE' ? 'Rejeté' : 'Attente validation'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                        >
                          Détails / Justificatifs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal justificatifs KYC */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>
              
              <h3 className="text-lg font-black text-white mb-2">Justificatifs KYC de {selectedUser.firstName} {selectedUser.lastName}</h3>
              <p className="text-[10px] text-slate-500 mb-6 font-mono">ID Client: {selectedUser.id}</p>

              {/* Lecture des documents JSON */}
              {(() => {
                let docs = { cni: '', photo: '', facture: '' };
                try {
                  if (selectedUser.kycDocuments) {
                    docs = JSON.parse(selectedUser.kycDocuments);
                  }
                } catch(e) {}

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5 text-xs">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                        <span className="font-bold text-slate-400">1. Carte Nationale d'Identité</span>
                        {docs.cni ? (
                          <a 
                            href={docs.cni} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-orange-400 hover:underline flex items-center gap-1 font-bold"
                          >
                            <FileText className="h-3.5 w-3.5" /> Voir le document
                          </a>
                        ) : (
                          <span className="text-slate-650">Non fournie</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                        <span className="font-bold text-slate-400">2. Photo de Profil (Selfie)</span>
                        {docs.photo ? (
                          <a 
                            href={docs.photo} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-orange-400 hover:underline flex items-center gap-1 font-bold"
                          >
                            <FileText className="h-3.5 w-3.5" /> Voir la photo
                          </a>
                        ) : (
                          <span className="text-slate-650">Non fournie</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-400">3. Facture CIE ou SODECI</span>
                        {docs.facture ? (
                          <a 
                            href={docs.facture} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-orange-400 hover:underline flex items-center gap-1 font-bold"
                          >
                            <FileText className="h-3.5 w-3.5" /> Voir la facture
                          </a>
                        ) : (
                          <span className="text-slate-650">Non fournie</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="flex-1 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Fermer
                      </button>
                      <button
                        onClick={() => handleKycValidation(selectedUser.id, 'REJETE')}
                        disabled={actionLoading}
                        className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/20 font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Rejeter le dossier
                      </button>
                      <button
                        onClick={() => handleKycValidation(selectedUser.id, 'APPROUVE')}
                        disabled={actionLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Approuver & Valider
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Onglet 3 : Validation des Ordres BRVM */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Traitement des ordres boursiers</h3>
              <p className="text-xs text-slate-400">Validez les opérations d'achat et de vente d'actions transmises par les clients.</p>
            </div>

            {/* Erreur opérationnelle */}
            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {actionError}
              </div>
            )}

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Client</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Titre (Code)</th>
                    <th className="p-4">Quantité</th>
                    <th className="p-4">Cours demandé</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-200">{o.User?.email || 'Inconnu'}</td>
                      <td className="p-4">
                        <span className={`font-black uppercase tracking-wider text-[10px] ${
                          o.type === 'ACHAT' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {o.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white">{o.codeValeur}</td>
                      <td className="p-4 font-mono">{o.quantityRequested}</td>
                      <td className="p-4 font-mono font-black text-white">{o.priceRequested.toLocaleString()} F</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'EXECUTE' 
                            ? 'bg-emerald-500/10 text-emerald-405 border border-emerald-500/15' 
                            : o.status === 'ANNULE'
                            ? 'bg-rose-500/10 text-rose-455 border border-rose-500/15'
                            : 'bg-orange-500/10 text-orange-455 border border-orange-500/15'
                        }`}>
                          {o.status === 'EXECUTE' ? 'Exécuté' : o.status === 'ANNULE' ? 'Annulé' : 'Attente validation'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {o.status === 'EN_ATTENTE' ? (
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="bg-orange-500 hover:bg-orange-600 text-slate-950 px-3 py-1.5 rounded-lg font-black text-[10px] transition-colors ml-auto cursor-pointer"
                          >
                            Traiter l'ordre
                          </button>
                        ) : (
                          <span className="text-slate-600 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal traitement Ordre */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>

              <h3 className="text-lg font-black text-white mb-2">Traiter l'Ordre {selectedOrder.type} {selectedOrder.codeValeur}</h3>
              <p className="text-[10px] text-slate-500 mb-6 font-mono">ID Ordre: {selectedOrder.id}</p>

              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-xs font-mono space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Titres :</span>
                    <span className="text-white font-bold">{selectedOrder.quantityRequested} actions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prix demandé :</span>
                    <span className="text-white">{selectedOrder.priceRequested.toLocaleString()} F</span>
                  </div>
                  <div className="flex justify-between font-sans pt-2 border-t border-slate-850 text-sm font-black">
                    <span className="text-slate-400">Total :</span>
                    <span className="text-orange-400">
                      {(selectedOrder.quantityRequested * selectedOrder.priceRequested).toLocaleString()} F
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Cours réel d'exécution à la BRVM (Optionnel)
                  </label>
                  <input
                    type="number"
                    placeholder={`Par défaut: ${selectedOrder.priceRequested} F`}
                    value={priceRealInput}
                    onChange={(e) => setPriceRealInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-orange-500 text-xs transition-colors"
                  />
                  <span className="text-[9px] text-slate-500 block pt-1.5">Laissez vide pour valider au même cours demandé par le client.</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => handleOrderProcess(selectedOrder.id, 'ANNULE')}
                    disabled={actionLoading}
                    className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500/20 font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Annuler l'ordre
                  </button>
                  <button
                    onClick={() => handleOrderProcess(selectedOrder.id, 'EXECUTE')}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Exécuter & Créditer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 4 : Suivi Transactions & Export */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Mouvements de fonds (Dépôts / Retraits)</h3>
                <p className="text-xs text-slate-400">Consultez l'historique complet des paiements via Mobile Money.</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 ml-auto lg:ml-0 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Exporter en CSV</span>
              </button>
            </div>

            {/* Barre de Recherche et Filtres */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par ID ou Email..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-orange-500"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-650" />
              </div>

              <div>
                <select
                  value={txTypeFilter}
                  onChange={(e: any) => setTxTypeFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Tous les types</option>
                  <option value="DEPOT">Dépôts (C2B)</option>
                  <option value="RETRAIT">Retraits (B2C)</option>
                </select>
              </div>

              <div>
                <select
                  value={txStatusFilter}
                  onChange={(e: any) => setTxStatusFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="SUCCES">Succès</option>
                  <option value="ECHEC">Échecs</option>
                  <option value="EN_COURS">En cours</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">ID Transaction</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.idInternal} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-400 truncate max-w-[120px]">{tx.idInternal}</td>
                      <td className="p-4 font-bold text-white">{tx.User?.email || 'Inconnu'}</td>
                      <td className="p-4">
                        <span className={`font-black uppercase tracking-wider text-[10px] ${
                          tx.type === 'DEPOT' ? 'text-emerald-400' : 'text-indigo-400'
                        }`}>
                          {tx.type === 'DEPOT' ? 'Dépôt' : 'Retrait'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-black text-white text-sm">{tx.amount.toLocaleString()} F</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'SUCCES' 
                            ? 'bg-emerald-500/10 text-emerald-455 border border-emerald-500/15' 
                            : tx.status === 'ECHEC'
                            ? 'bg-rose-500/10 text-rose-455 border border-rose-500/15'
                            : 'bg-orange-500/10 text-orange-455 border border-orange-500/15'
                        }`}>
                          {tx.status === 'SUCCES' ? 'Réussi' : tx.status === 'ECHEC' ? 'Échoué' : 'En cours'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onglet 5 : Litiges & Incidents */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            
            {/* Transactions en échec */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-500 animate-pulse" />
                  <span>Transactions PawaPay en Échec</span>
                </h3>
                <p className="text-xs text-slate-400">Liste des dépôts et retraits ayant été rejetés par l'opérateur local.</p>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase">
                      <th className="p-4">ID Transaction</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Montant</th>
                      <th className="p-4 text-right">Date d'Échec</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {incidents?.failedTransactions.map((tx: any) => (
                      <tr key={tx.idInternal} className="hover:bg-slate-850/50">
                        <td className="p-4 font-mono font-bold text-slate-400">{tx.idInternal}</td>
                        <td className="p-4 font-bold text-white">{tx.User?.email}</td>
                        <td className="p-4 text-rose-400 font-bold uppercase">{tx.type}</td>
                        <td className="p-4 font-mono font-black text-white">{tx.amount.toLocaleString()} F</td>
                        <td className="p-4 text-right font-mono text-slate-500">{new Date(tx.updatedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {incidents?.failedTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                          Aucun incident de transaction en échec détecté.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transactions bloquées (Callbacks orphelins suspectés) */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500 animate-pulse" />
                  <span>Transactions Suspectes en cours (&gt;5 min)</span>
                </h3>
                <p className="text-xs text-slate-400">Transactions à l'état EN_COURS n'ayant reçu aucune notification de la part du webhook PawaPay.</p>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase">
                      <th className="p-4">ID Transaction</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Montant</th>
                      <th className="p-4 text-right">Date d'Initiation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {incidents?.stuckTransactions.map((tx: any) => (
                      <tr key={tx.idInternal} className="hover:bg-slate-850/50">
                        <td className="p-4 font-mono font-bold text-slate-400">{tx.idInternal}</td>
                        <td className="p-4 font-bold text-white">{tx.User?.email}</td>
                        <td className="p-4 text-orange-400 font-bold uppercase">{tx.type}</td>
                        <td className="p-4 font-mono font-black text-white">{tx.amount.toLocaleString()} F</td>
                        <td className="p-4 text-right font-mono text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {incidents?.stuckTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                          Aucun blocage suspect ou retard de webhook PawaPay détecté.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-950 h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
