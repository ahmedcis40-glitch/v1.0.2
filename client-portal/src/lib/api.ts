const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function requestApi(endpoint: string, method = 'GET', body?: any, token?: string | null) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: getHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Une erreur est survenue (${res.status})`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: any) => requestApi('/auth/register', 'POST', data),
    login: (data: any) => requestApi('/auth/login', 'POST', data),
    me: (token: string) => requestApi('/auth/me', 'GET', null, token),
  },
  wallets: {
    getCash: (token: string) => requestApi('/wallets/cash', 'GET', null, token),
    getSecurities: (token: string) => requestApi('/wallets/securities', 'GET', null, token),
    getTransactions: (token: string) => requestApi('/wallets/transactions', 'GET', null, token),
  },
  pawapay: {
    initiateDeposit: (data: any, token: string) => requestApi('/pawapay/deposit', 'POST', data, token),
    initiateWithdraw: (data: any, token: string) => requestApi('/pawapay/withdraw', 'POST', data, token),
    simulateCallback: (id: string, status: 'COMPLETED' | 'FAILED', isWithdrawal = false) => {
      return fetch(`${API_BASE}/pawapay/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pawapay-signature': 'VALIDATED_SIMULATED'
        },
        body: JSON.stringify({
          depositId: isWithdrawal ? undefined : id,
          payoutId: isWithdrawal ? id : undefined,
          status,
          failureCode: status === 'FAILED' ? 'USER_CANCELLED' : undefined
        })
      });
    }
  },
  market: {
    getStocks: () => requestApi('/market/stocks', 'GET'),
    getSgis: () => requestApi('/market/sgis', 'GET'),
  },
  orders: {
    create: (data: any, token: string) => requestApi('/orders', 'POST', data, token),
    getMy: (token: string) => requestApi('/orders/my', 'GET', null, token),
  },
  admin: {
    getUsers: (token: string) => requestApi('/admin/users', 'GET', null, token),
    updateKyc: (id: string, kycStatus: string, token: string) => requestApi(`/admin/users/${id}/kyc`, 'PATCH', { kycStatus }, token),
    getTransactions: (token: string) => requestApi('/admin/transactions', 'GET', null, token),
    getIncidents: (token: string) => requestApi('/admin/incidents', 'GET', null, token),
    getReporting: (token: string) => requestApi('/admin/reporting', 'GET', null, token),
    getOrders: (token: string) => requestApi('/admin/orders', 'GET', null, token),
    processOrder: (id: string, status: string, priceReal: number | null, token: string) => requestApi(`/admin/orders/${id}/process`, 'PATCH', { status, priceReal }, token),
  },
  support: {
    getLogs: (token: string) => requestApi('/support/logs', 'GET', null, token),
    createLog: (level: string, message: string, stack?: string, context?: string) => requestApi('/support/logs', 'POST', { level, message, stack, context }),
  },
};
