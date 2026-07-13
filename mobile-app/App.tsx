import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { storage } from './src/lib/storage';
import { api } from './src/lib/api';

// Vues
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PaymentScreen from './src/screens/PaymentScreen';

type ScreenState = 'login' | 'dashboard' | 'settings' | 'deposit' | 'withdraw';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('login');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Monitor net info changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, []);

  // Check login session on startup
  useEffect(() => {
    async function checkAuth() {
      const storedToken = await storage.getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          // Si on est en ligne, rafraîchir l'utilisateur
          const state = await NetInfo.fetch();
          const online = state.isConnected && state.isInternetReachable !== false;
          
          if (online) {
            const userData = await api.auth.me(storedToken);
            setUser(userData);
            await storage.saveCachedUser(userData);
          } else {
            // Hors-ligne: Charger du cache
            const cachedUser = await storage.getCachedUser();
            setUser(cachedUser);
          }
          setScreen('dashboard');
        } catch (e) {
          // Token expiré ou invalide
          await storage.clearAuthToken();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const handleLoginSuccess = (userToken: string, userData: any) => {
    setToken(userToken);
    setUser(userData);
    setScreen('dashboard');
  };

  const handleLogout = async () => {
    await storage.clearAuthToken();
    setToken(null);
    setUser(null);
    setScreen('login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8200" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('login')} />
      )}

      {screen === 'login' && (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          onConfigureIp={() => setScreen('settings')}
        />
      )}

      {screen === 'dashboard' && (
        <DashboardScreen 
          user={user}
          token={token}
          onLogout={handleLogout}
          onInitiateDeposit={() => setScreen('deposit')}
          onInitiateWithdraw={() => setScreen('withdraw')}
          isOffline={isOffline}
        />
      )}

      {screen === 'deposit' && (
        <PaymentScreen 
          type="DEPOT"
          user={user}
          token={token}
          onBack={() => setScreen('dashboard')}
        />
      )}

      {screen === 'withdraw' && (
        <PaymentScreen 
          type="RETRAIT"
          user={user}
          token={token}
          onBack={() => setScreen('dashboard')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
