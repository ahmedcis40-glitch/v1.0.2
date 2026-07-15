import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, SafeAreaView, Linking } from 'react-native';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { Lock, Mail, Settings, ShieldCheck } from 'lucide-react-native';

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

  const handleRegisterRedirect = async () => {
    try {
      const baseIp = await storage.getServerIp();
      const registerUrl = baseIp.replace(':3000', ':8080') + '/register';
      await Linking.openURL(registerUrl);
    } catch (err: any) {
      setError("Impossible d'ouvrir le navigateur pour l'inscription. Veuillez visiter le portail web.");
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
            <TouchableOpacity onPress={handleRegisterRedirect}>
              <Text style={styles.registerLink}> S'inscrire</Text>
            </TouchableOpacity>
          </View>
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
