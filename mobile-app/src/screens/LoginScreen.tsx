import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, SafeAreaView, Linking, Alert } from 'react-native';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { Lock, Mail, Settings, ShieldCheck, FileText, Upload, Image } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function LoginScreen({ 
  onLoginSuccess, 
  onConfigureIp 
}: { 
  onLoginSuccess: (token: string, user: any) => void;
  onConfigureIp: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mode Inscription local
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [sgiPartenaire, setSgiPartenaire] = useState('Société Générale Capital Securities');
  const [investorProfile, setInvestorProfile] = useState('MODERE');
  const [investorObjective, setInvestorObjective] = useState('EPARGNE');
  const [investorHorizon, setInvestorHorizon] = useState('MOYEN_TERME');

  // Justificatifs KYC réels
  const [cniRecto, setCniRecto] = useState<string | null>(null);
  const [cniVerso, setCniVerso] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [facture, setFacture] = useState<string | null>(null);

  const pickImage = async (type: 'recto' | 'verso' | 'photo' | 'facture') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission requise", "Nous avons besoin de la permission d'accès aux photos pour charger vos justificatifs.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.4, // Compresser pour alléger le base64 envoyé par l'API
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const base64Data = `data:image/jpeg;base64,${asset.base64}`;
        if (type === 'recto') setCniRecto(base64Data);
        if (type === 'verso') setCniVerso(base64Data);
        if (type === 'photo') setPhoto(base64Data);
        if (type === 'facture') setFacture(base64Data);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.auth.login({ phoneOrEmail: email, password });
      await storage.saveAuthToken(response.accessToken);
      await storage.saveCachedUser(response.user);
      onLoginSuccess(response.accessToken, response.user);
    } catch (err: any) {
      setError(err.message || "Identifiants invalides ou impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !regEmail || !regPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Mot de passe).");
      return;
    }

    if (regPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!cniRecto || !cniVerso || !photo || !facture) {
      setError("Veuillez charger tous les justificatifs KYC requis (CNI Recto/Verso, Selfie et Facture).");
      return;
    }

    setLoading(true);
    setError('');

    // Génération automatique du numéro de téléphone
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    const phone = `+22507${randomSuffix}`;

    const kycDocumentsJson = JSON.stringify({
      cniRecto,
      cniVerso,
      photo,
      facture,
    });

    try {
      await api.auth.register({
        firstName,
        lastName,
        email: regEmail,
        phone,
        whatsappPhone,
        kycDocuments: kycDocumentsJson,
        password: regPassword,
        consentSMS: true,
        consentWhatsApp: true,
        sgiPartenaire,
        investorProfile,
        investorObjective,
        investorHorizon,
      });

      Alert.alert("Inscription Réussie !", "Votre compte BAOU a été créé et vos pièces justificatives ont été transmises pour validation. Vous pouvez maintenant vous connecter.");
      setEmail(regEmail);
      setPassword(regPassword);
      setIsRegisterMode(false);

      // Reset
      setFirstName('');
      setLastName('');
      setRegEmail('');
      setRegPassword('');
      setConfirmPassword('');
      setWhatsappPhone('');
      setCniRecto(null);
      setCniVerso(null);
      setPhoto(null);
      setFacture(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Liseré tricolore ivoirien */}
      <View style={styles.tricolor} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* En-tête avec bouton paramètres IP */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsButton} onPress={onConfigureIp}>
            <Settings size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            {/* Logo Baou stylisé en SVG/Text */}
            <Text style={styles.logoText}>🐘</Text>
          </View>
          <Text style={styles.brandName}>BAOU FINANCE</Text>
          <Text style={styles.brandSub}>L'investissement Boursier en Côte d'Ivoire</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {!isRegisterMode ? (
            <>
              {/* Formulaire Connexion */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADRESSE EMAIL</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color="#475569" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Ex: jean.koffi@sgi.ci"
                    placeholderTextColor="#475569"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>MOT DE PASSE</Text>
                <View style={styles.inputContainer}>
                  <Lock size={16} color="#475569" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#020617" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Vous n'avez pas de compte ?</Text>
                <TouchableOpacity onPress={() => { setIsRegisterMode(true); setError(''); }}>
                  <Text style={styles.registerLink}> S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Formulaire Inscription */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>PRÉNOM</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Jean"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>NOM</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Koffi"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADRESSE EMAIL</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color="#475569" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    placeholder="jean.koffi@sgi.ci"
                    placeholderTextColor="#475569"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NUMÉRO WHATSAPP</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={whatsappPhone}
                    onChangeText={setWhatsappPhone}
                    placeholder="Ex: +2250707070707"
                    placeholderTextColor="#475569"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>MOT DE PASSE</Text>
                <View style={styles.inputContainer}>
                  <Lock size={16} color="#475569" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
                <View style={styles.inputContainer}>
                  <Lock size={16} color="#475569" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>



              {/* Section Pièces Justificatives KYC */}
              <View style={[styles.inputGroup, { marginTop: 15 }]}>
                <Text style={styles.label}>JUSTIFICATIFS RÉGLEMENTAIRES (KYC)</Text>
                
                <View style={{ flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {/* CNI Recto */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="#ff8200" />
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>1. CNI Recto</Text>
                        <Text style={{ color: cniRecto ? '#10b981' : '#64748b', fontSize: 9 }}>
                          {cniRecto ? '✓ Document chargé' : 'Non fourni'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => pickImage('recto')} style={{ backgroundColor: cniRecto ? '#10b981' : '#ff8200', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                      <Text style={{ color: '#020617', fontSize: 9, fontWeight: 'bold' }}>{cniRecto ? 'Modifier' : 'Importer'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* CNI Verso */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="#ff8200" />
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>2. CNI Verso</Text>
                        <Text style={{ color: cniVerso ? '#10b981' : '#64748b', fontSize: 9 }}>
                          {cniVerso ? '✓ Document chargé' : 'Non fourni'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => pickImage('verso')} style={{ backgroundColor: cniVerso ? '#10b981' : '#ff8200', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                      <Text style={{ color: '#020617', fontSize: 9, fontWeight: 'bold' }}>{cniVerso ? 'Modifier' : 'Importer'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Selfie */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="#ff8200" />
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>3. Photo d'Identité / Selfie</Text>
                        <Text style={{ color: photo ? '#10b981' : '#64748b', fontSize: 9 }}>
                          {photo ? '✓ Selfie chargé' : 'Non fourni'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => pickImage('photo')} style={{ backgroundColor: photo ? '#10b981' : '#ff8200', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                      <Text style={{ color: '#020617', fontSize: 9, fontWeight: 'bold' }}>{photo ? 'Modifier' : 'Importer'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Facture justificatif */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="#ff8200" />
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>4. Justificatif de domicile</Text>
                        <Text style={{ color: facture ? '#10b981' : '#64748b', fontSize: 9 }}>
                          {facture ? '✓ Document chargé' : 'Non fourni'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => pickImage('facture')} style={{ backgroundColor: facture ? '#10b981' : '#ff8200', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                      <Text style={{ color: '#020617', fontSize: 9, fontWeight: 'bold' }}>{facture ? 'Modifier' : 'Importer'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>
                Note : Vos documents réglementaires d'identité (CNI, selfie et justificatif) sont requis par l'AMF-UMOA pour autoriser vos investissements en actions.
              </Text>

              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: '#ff8200' }]} 
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#020617" size="small" />
                ) : (
                  <Text style={[styles.loginButtonText, { color: '#020617' }]}>Créer mon compte</Text>
                )}
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Vous avez déjà un compte ?</Text>
                <TouchableOpacity onPress={() => { setIsRegisterMode(false); setError(''); }}>
                  <Text style={styles.registerLink}> Se connecter</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <ShieldCheck size={14} color="#64748b" style={{ marginRight: 4 }} />
          <Text style={styles.footerText}>Sécurisé & Agréé AMF-UMOA</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  tricolor: {
    height: 3,
    backgroundColor: '#ff8200',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoCircle: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 130, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 130, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 14,
  },
  loginButton: {
    backgroundColor: '#ff8200',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '900',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 11,
    color: '#64748b',
  },
  registerLink: {
    fontSize: 11,
    color: '#ff8200',
    fontWeight: 'bold',
  },
});
