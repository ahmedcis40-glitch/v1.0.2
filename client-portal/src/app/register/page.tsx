'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers';
import { useRouter } from 'next/navigation';
import { Coins, User, Mail, Lock, ArrowLeft, Upload, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();

  // Basic info states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');

  // Pièces Justificatives states
  const [cniRectoFile, setCniRectoFile] = useState<File | null>(null);
  const [cniVersoFile, setCniVersoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [factureFile, setFactureFile] = useState<File | null>(null);

  // Consent states
  const [consentSMS, setConsentSMS] = useState(true);
  const [consentWhatsApp, setConsentWhatsApp] = useState(true);

  // Error and UI states
  const [error, setError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cniRecto' | 'cniVerso' | 'photo' | 'facture') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (type === 'cniRecto') setCniRectoFile(file);
      if (type === 'cniVerso') setCniVersoFile(file);
      if (type === 'photo') setPhotoFile(file);
      if (type === 'facture') setFactureFile(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Validation de l'identité des mots de passe
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // 2. Validation de la présence de toutes les pièces justificatives
    if (!cniRectoFile || !cniVersoFile || !photoFile || !factureFile) {
      setError('Veuillez fournir toutes les pièces justificatives requises (CNI Recto, CNI Verso, Photo, Facture).');
      return;
    }

    setRegLoading(true);

    // 3. Génération d'un numéro de téléphone unique fictif requis par la base de données
    // (Puisque nous l'avons enlevé du formulaire, nous le générons côté client pour respecter le schéma DB).
    // Les numéros en Côte d'Ivoire font 10 chiffres (ici on génère un format à 10 chiffres commençant par 07).
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    const phone = `+22507${randomSuffix}`;

    try {
      // Conversion des fichiers en Base64
      const cniRectoBase64 = await fileToBase64(cniRectoFile);
      const cniVersoBase64 = await fileToBase64(cniVersoFile);
      const photoBase64 = await fileToBase64(photoFile);
      const factureBase64 = await fileToBase64(factureFile);

      const kycDocumentsJson = JSON.stringify({
        cniRecto: cniRectoBase64,
        cniVerso: cniVersoBase64,
        photo: photoBase64,
        facture: factureBase64,
      });

      await register({
        firstName,
        lastName,
        email,
        phone, // Fourni de façon transparente pour préserver la DB
        whatsappPhone,
        kycDocuments: kycDocumentsJson,
        password,
        consentSMS,
        consentWhatsApp,
      });
      alert('Inscription réussie ! Vos pièces justificatives ont été transmises pour conformité. Vous pouvez vous connecter.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
      setRegLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 min-h-screen">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-extrabold text-white text-xs tracking-wider">BAOU FINANCE</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-orange-500 via-white to-emerald-500 rounded-full"></span>
            <span>Création de compte</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">Ouvrez votre portefeuille d'investissement avec vos pièces justificatives.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1 : Informations de base */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-slate-800/60 pb-1">1. Profil Identité</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Prénom</label>
                <div className="relative">
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  <User className="absolute right-3 top-3.5 h-4 w-4 text-slate-600" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Nom</label>
                <div className="relative">
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Koffi"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  <User className="absolute right-3 top-3.5 h-4 w-4 text-slate-600" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Adresse Email</label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean@koffi.ci"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
                />
                <Mail className="absolute right-3 top-3.5 h-4 w-4 text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Numéro WhatsApp (avec indicatif)</label>
              <div className="relative">
                <input
                  type="tel"
                  id="whatsappPhone"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="Ex: +2250701020304"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
                />
                <span className="absolute right-3 top-3 text-[10px] text-slate-600 font-bold uppercase">WhatsApp</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Confirmer le MDP</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Pièces Justificatives */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-slate-800/60 pb-1">2. Pièces Justificatives (KYC)</h3>
            
            <div className="space-y-3">
              {/* CNI Recto */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-lg gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Pièce d'Identité (Recto)</span>
                    <span className="text-[10px] text-slate-500">Format PNG, JPG, PDF</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer hover:bg-slate-800 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Uploader</span>
                  <input type="file" onChange={(e) => handleFileChange(e, 'cniRecto')} accept="image/*,application/pdf" className="hidden" />
                </label>
                {cniRectoFile && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    {cniRectoFile.name}
                  </span>
                )}
              </div>

              {/* CNI Verso */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-lg gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Pièce d'Identité (Verso)</span>
                    <span className="text-[10px] text-slate-500">Format PNG, JPG, PDF</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer hover:bg-slate-800 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Uploader</span>
                  <input type="file" onChange={(e) => handleFileChange(e, 'cniVerso')} accept="image/*,application/pdf" className="hidden" />
                </label>
                {cniVersoFile && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    {cniVersoFile.name}
                  </span>
                )}
              </div>

              {/* Photo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-lg gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Photo d'Identité</span>
                    <span className="text-[10px] text-slate-500">Format JPG, PNG (Selfie net)</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer hover:bg-slate-800 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Uploader</span>
                  <input type="file" onChange={(e) => handleFileChange(e, 'photo')} accept="image/*" className="hidden" />
                </label>
                {photoFile && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    {photoFile.name}
                  </span>
                )}
              </div>

              {/* Facture CIE ou SODECI */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-lg gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Justificatif de domicile (CIE, SODECI...)</span>
                    <span className="text-[10px] text-slate-500">Facture de moins de 3 mois</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer hover:bg-slate-800 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Uploader</span>
                  <input type="file" onChange={(e) => handleFileChange(e, 'facture')} accept="image/*,application/pdf" className="hidden" />
                </label>
                {factureFile && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    {factureFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3 : Consentements */}
          <div className="space-y-2 pt-2 border-t border-slate-800/40">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentSMS}
                onChange={(e) => setConsentSMS(e.target.checked)}
                className="h-4 w-4 rounded border-slate-850 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="text-xs text-slate-400">J'accepte de recevoir des notifications d'alertes par SMS.</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentWhatsApp}
                onChange={(e) => setConsentWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-850 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="text-xs text-slate-400">J'accepte de recevoir mes reçus de transactions par WhatsApp.</span>
            </label>
          </div>

          <button
            type="submit"
            id="registerBtn"
            disabled={regLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50 text-slate-950 font-bold py-3.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer text-sm"
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
