import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { storage } from '../lib/storage';
import { Landmark, ArrowLeft, Wifi, WifiOff } from 'lucide-react-native';

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [ipInput, setIpInput] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  useEffect(() => {
    storage.getServerIp().then(setIpInput);
  }, []);

  const handleSave = async () => {
    let cleanIp = ipInput.trim();
    if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
      cleanIp = `http://${cleanIp}`;
    }
    // Retirer le slash final s'il y en a un
    if (cleanIp.endsWith('/')) {
      cleanIp = cleanIp.slice(0, -1);
    }
    
    await storage.saveServerIp(cleanIp);
    Alert.alert("Configuration", "Adresse IP du serveur NestJS sauvegardée.");
    onBack();
  };

  const testConnection = async () => {
    setTestStatus('testing');
    let cleanIp = ipInput.trim();
    if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
      cleanIp = `http://${cleanIp}`;
    }
    if (cleanIp.endsWith('/')) {
      cleanIp = cleanIp.slice(0, -1);
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(`${cleanIp}/market/stocks`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(id);

      if (res.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
      }
    } catch (e) {
      setTestStatus('failed');
    }
  };

  return (
    <View style={styles.container}>
      {/* Liseré tricolore ivoirien */}
      <View style={styles.tricolor} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>Configuration Réseau</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Landmark size={48} color="#ff8200" />
        </View>

        <Text style={styles.description}>
          Saisissez l'adresse IP locale de votre machine ou l'URL du serveur backend NestJS pour communiquer en réseau local (Wi-Fi).
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL DU SERVEUR BACKEND</Text>
          <TextInput
            style={styles.input}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="Ex: http://192.168.1.50:3000"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {testStatus === 'success' && (
          <View style={[styles.statusBox, styles.successBox]}>
            <Wifi size={16} color="#10b981" style={{ marginRight: 6 }} />
            <Text style={styles.successText}>Connexion réussie ! Le serveur NestJS est en ligne.</Text>
          </View>
        )}

        {testStatus === 'failed' && (
          <View style={[styles.statusBox, styles.failedBox]}>
            <WifiOff size={16} color="#f43f5e" style={{ marginRight: 6 }} />
            <Text style={styles.failedText}>Échec de connexion. Vérifiez l'IP ou le réseau Wi-Fi.</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testConnection}
            disabled={testStatus === 'testing'}
          >
            {testStatus === 'testing' ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.testButtonText}>Tester la connexion</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer & Retourner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: 50,
  },
  tricolor: {
    height: 3,
    backgroundColor: '#ff8200', // orange
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 13,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  successText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  failedBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    borderColor: 'rgba(244, 63, 94, 0.15)',
  },
  failedText: {
    color: '#f43f5e',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actions: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#ff8200',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '900',
  },
});
