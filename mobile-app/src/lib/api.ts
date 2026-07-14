import { storage } from './storage';

export async function requestApi(endpoint: string, method = 'GET', body?: any, token?: string | null) {
  const baseIp = await storage.getServerIp();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseIp}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMsg = 'Erreur lors de la requête API';
    try {
      const data = await res.json();
      errorMsg = data.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  auth: {
    login: (data: any) => requestApi('/auth/login', 'POST', data),
    register: (data: any) => requestApi('/auth/register', 'POST', data),
    me: (token: string) => requestApi('/auth/me', 'GET', null, token),
  },
  wallets: {
    getCash: (token: string) => requestApi('/wallets/cash', 'GET', null, token),
    getSecurities: (token: string) => requestApi('/wallets/securities', 'GET', null, token),
    getTransactions: (token: string) => requestApi('/wallets/transactions', 'GET', null, token),
  },
  wave: {
    initiateDeposit: (data: any, token: string) => requestApi('/wave/deposit', 'POST', data, token),
    initiateWithdraw: (data: any, token: string) => requestApi('/wave/withdraw', 'POST', data, token),
  },
  market: {
    getStocks: () => requestApi('/market/stocks', 'GET'),
  },
  orders: {
    create: (data: any, token: string) => requestApi('/orders', 'POST', data, token),
    getMy: (token: string) => requestApi('/orders/my', 'GET', null, token),
  },
};
