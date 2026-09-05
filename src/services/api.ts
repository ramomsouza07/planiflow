import type { 
  Transaction, 
  Category, 
  InvestmentAsset, 
  EmergencyFundConfig 
} from '../types/finance';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getToken = (): string | null => {
  return localStorage.getItem('finflow_auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('finflow_auth_token', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('finflow_auth_token');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Erro na requisição: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      return request<{ user: { id: string; name: string; email: string }; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    register: async (name: string, email: string, password: string) => {
      return request<{ user: { id: string; name: string; email: string }; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
    },
    me: async () => {
      return request<{ user: { id: string; name: string; email: string } }>('/api/auth/me');
    },
    updateProfile: async (data: { name?: string }) => {
      return request<{ user: { id: string; name: string; email: string } }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      return request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
    getSecurityStatus: async () => {
      return request<{
        status: string;
        algorithm: string;
        keyLengthBits: number;
        authenticatedEncryption: boolean;
        atRestProtection: string;
        passwordProtection: string;
        dataIsolation: string;
        timestamp: string;
      }>('/api/auth/security-status');
    },
  },

  transactions: {
    getAll: async () => {
      return request<{ transactions: Transaction[] }>('/api/transactions');
    },
    create: async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      return request<{ transaction: Transaction }>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<Transaction>) => {
      return request<{ transaction: Transaction }>(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
    },
    bulk: async (items: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      return request<{ count: number }>('/api/transactions/bulk', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
    },
    clearAll: async () => {
      return request<{ message: string }>('/api/transactions', {
        method: 'DELETE',
      });
    },
  },

  categories: {
    getAll: async () => ({ categories: [] }),
    create: async (data: Omit<Category, 'id'>) => ({ category: { ...data, id: `custom-${Date.now()}` } }),
    delete: async (_id: string) => ({ message: 'ok' }),
  },

  investments: {
    getAll: async () => {
      return request<{ investments: InvestmentAsset[] }>('/api/investments');
    },
    create: async (data: Omit<InvestmentAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
      return request<{ investment: InvestmentAsset }>('/api/investments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<InvestmentAsset>) => {
      return request<{ investment: InvestmentAsset }>(`/api/investments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/api/investments/${id}`, {
        method: 'DELETE',
      });
    },
  },

  emergencyFund: {
    get: async () => {
      return request<{ emergencyFund: EmergencyFundConfig }>('/api/emergency-fund');
    },
    update: async (data: Partial<EmergencyFundConfig>) => {
      return request<{ emergencyFund: EmergencyFundConfig }>('/api/emergency-fund', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },
};
