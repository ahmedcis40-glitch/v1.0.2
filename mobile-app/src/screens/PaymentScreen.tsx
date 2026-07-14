import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { api } from '../lib/api';
import { ArrowLeft, Coins, CreditCard } from 'lucide-react-native';

type PaymentType = 'DEPOT' | 'RETRAIT';

export default function PaymentScreen({
  type,
  user,
  token,
  onBack,
}: {
  type: PaymentType;
  user: any;
  token: string | null;
  onBack: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [correspondent, setCorrespondent] = useState('ORANGE_CI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const isDeposit = type === 'DEPOT';

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Veuillez saisir un montant valide.");
      return;
    }
    if (!phone) {
      setError("Veuillez renseigner votre numéro Mobile Money.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!token) throw new Error("Session d'authentification expirée.");

      let res;
      if (isDeposit) {
        res = await api.wave.initiateDeposit({
          amount: parseFloat(amount),
          phone,
        }, token);
      } else {
        res = await api.wave.initiateWithdraw({
          amount: parseFloat(amount),
          phone,
        }, token);
      }

      if (res.redirectUrl) {
        // Ouvrir la page de paiement / simulation PawaPay dans la WebView
        setPaymentUrl(res.redirectUrl);
      } else {
        Alert.alert("Succès", `${isDeposit ? 'Dépôt' : 'Retrait'} initié avec succès.`);
        onBack();
      }
    } catch (err: any) {
      setError(err.message || "Impossible d'initier la transaction.");
    } finally {
      setLoading(false);
    }
  };

  // Intercepter les changements d'URL de la WebView pour détecter la fin de la transaction
  const handleNavigationChange = (navState: any) => {
    const url = navState.url;
    // Si l'URL de retour vers le dashboard est atteinte
    if (url.includes('/dashboard') || url.includes('paymentResult=')) {
      setPaymentUrl(null);
      const isSuccess = url.includes('paymentResult=success');
      if (isSuccess) {
        Alert.alert("Félicitations", `${isDeposit ? 'Dépôt' : 'Retrait'} effectué avec succès !`);
      } else {
        Alert.alert("Information", "La transaction a été annulée ou a échoué.");
      }
      onBack();
    }
  };

  if (paymentUrl) {
    return (
      <SafeAreaView style={styles.webviewContainer}>
        {/* Header WebView */}
        <View style={styles.webviewHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setPaymentUrl(null)}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.webviewTitle}>Passerelle de Paiement</Text>
        </View>

        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationChange}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ff8200" />
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Liseré tricolore ivoirien */}
      <View style={styles.tricolor} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isDeposit ? "Dépôt Mobile Money" : "Retrait Mobile Money"}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Coins size={48} color="#ff8200" />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          
          {/* Opérateurs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CHOIX DE L'OPÉRATEUR</Text>
            <View style={styles.operatorsRow}>
              {[
                { id: 'ORANGE_CI', label: 'Orange' },
                { id: 'MTN_CI', label: 'MTN' },
                { id: 'MOOV_CI', label: 'Moov' },
                { id: 'WAVE_CI', label: 'Wave' },
              ].map((op) => {
                const isSelected = correspondent === op.id;
                return (
                  <TouchableOpacity
                    key={op.id}
                    style={[styles.operatorBtn, isSelected && styles.operatorBtnSelected]}
                    onPress={() => setCorrespondent(op.id)}
                  >
                    <Text style={[styles.operatorBtnText, isSelected && styles.operatorBtnTextSelected]}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Montant */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>MONTANT (XOF)</Text>
            <View style={styles.inputContainer}>
              <CreditCard size={16} color="#475569" style={{ marginRight: 12 }} />
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="Ex: 5000"
                placeholderTextColor="#475569"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Numéro de téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NUMÉRO MOBILE MONEY</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>+225</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0701020304"
                placeholderTextColor="#475569"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#020617" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isDeposit ? "Confirmer le Dépôt" : "Confirmer le Retrait"}
              </Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  tricolor: {
    height: 3,
    backgroundColor: '#ff8200',
    width: '100%',
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
  operatorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  operatorBtn: {
    flex: 1,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  operatorBtnSelected: {
    borderColor: '#ff8200',
    backgroundColor: 'rgba(255, 130, 0, 0.05)',
  },
  operatorBtnText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  operatorBtnTextSelected: {
    color: '#ff8200',
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
  prefix: {
    color: '#ff8200',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 14,
  },
  submitButton: {
    backgroundColor: '#ff8200',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '900',
  },

  // Styles WebView
  webviewContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  webviewTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
