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
  },
};
