import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SERVER_IP: '@server_ip',
  AUTH_TOKEN: '@auth_token',
  CACHED_USER: '@cached_user',
  CACHED_WALLET: '@cached_wallet',
  CACHED_SECURITIES: '@cached_securities',
  CACHED_TRANSACTIONS: '@cached_transactions',
  CACHED_STOCKS: '@cached_stocks',
};

export const storage = {
  // IP Serveur
  saveServerIp: async (ip: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.SERVER_IP, ip);
    } catch (e) {
      console.error("Erreur de sauvegarde de l'IP du serveur:", e);
    }
  },
  getServerIp: async (): Promise<string> => {
    try {
      return (await AsyncStorage.getItem(KEYS.SERVER_IP)) || 'http://192.168.1.100:3000'; // valeur de secours
    } catch (e) {
      return 'http://192.168.1.100:3000';
    }
  },

  // Token Auth
  saveAuthToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.error("Erreur de sauvegarde du token:", e);
    }
  },
  getAuthToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch (e) {
      return null;
    }
  },
  clearAuthToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(KEYS.CACHED_USER);
    } catch (e) {
      console.error("Erreur de suppression du token:", e);
    }
  },

  // Caching de données utilisateur
  saveCachedUser: async (user: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_USER, JSON.stringify(user));
    } catch (e) {}
  },
  getCachedUser: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Caching du portefeuille cash
  saveCachedWallet: async (wallet: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_WALLET, JSON.stringify(wallet));
    } catch (e) {}
  },
  getCachedWallet: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_WALLET);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Caching des actions possédées
  saveCachedSecurities: async (securities: any[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_SECURITIES, JSON.stringify(securities));
    } catch (e) {}
  },
  getCachedSecurities: async (): Promise<any[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_SECURITIES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Caching des transactions
  saveCachedTransactions: async (transactions: any[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {}
  },
  getCachedTransactions: async (): Promise<any[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Caching du marché actions BRVM
  saveCachedStocks: async (stocks: any[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_STOCKS, JSON.stringify(stocks));
    } catch (e) {}
  },
  getCachedStocks: async (): Promise<any[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_STOCKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
};
