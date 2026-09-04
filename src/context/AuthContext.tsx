import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types/auth';
import { api, setToken, clearToken, getToken } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, income?: number) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.auth.me();
        setUser({
          ...data.user,
          preferredCurrency: 'BRL',
          savingsGoalPercentage: 20,
        });
      } catch (err) {
        console.warn('Sessão expirada ou inválida:', err);
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setToken(res.token);
      setUser({
        ...res.user,
        preferredCurrency: 'BRL',
        savingsGoalPercentage: 20,
      });
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || 'Erro ao realizar login.' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(name, email, password);
      setToken(res.token);
      setUser({
        ...res.user,
        preferredCurrency: 'BRL',
        savingsGoalPercentage: 20,
      });
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || 'Erro ao cadastrar usuário.' };
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, ...data } : null);
    if (data.name) {
      try {
        const res = await api.auth.updateProfile({ name: data.name });
        if (res?.user) {
          setUser(prev => prev ? { ...prev, name: res.user.name } : null);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar perfil cifrado com servidor:', err);
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      return { success: true, message: res.message || 'Senha alterada com sucesso!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao alterar a senha.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
