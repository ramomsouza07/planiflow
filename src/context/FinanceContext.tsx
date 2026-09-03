import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  Transaction, 
  Category, 
  FilterOptions, 
  MonthlySummary, 
  InvestmentAsset, 
  EmergencyFundConfig 
} from '../types/finance';
import { DEFAULT_CATEGORIES } from '../types/finance';
import { SAMPLE_DEMO_TRANSACTIONS } from '../utils/initialData';
import { getCurrentMonth } from '../utils/formatters';
import { api, getToken } from '../services/api';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  investments: InvestmentAsset[];
  emergencyFund: EmergencyFundConfig;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkAddTransactions: (data: Partial<Transaction>[]) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  loadSampleData: () => Promise<void>;
  monthlySummary: MonthlySummary;
  filteredTransactions: Transaction[];
  availableMonths: string[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  addInvestment: (asset: Omit<InvestmentAsset, 'id' | 'updatedAt'>) => Promise<void>;
  updateInvestment: (id: string, asset: Partial<InvestmentAsset>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  updateEmergencyFund: (config: Partial<EmergencyFundConfig>) => Promise<void>;
  isLoadingData: boolean;
  reloadAllData: () => Promise<void>;
}

const DEFAULT_EMERGENCY_FUND: EmergencyFundConfig = {
  targetMonths: 6,
  customTargetAmount: 0,
  currentAmount: 0,
  institution: 'NuConta / Tesouro Selic',
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [investments, setInvestments] = useState<InvestmentAsset[]>([]);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFundConfig>(DEFAULT_EMERGENCY_FUND);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonth());

  const [filters, setFilters] = useState<FilterOptions>({
    month: getCurrentMonth(),
    type: 'all',
    category: '',
    status: 'all',
    searchQuery: '',
  });

  const handleSetSelectedMonth = (month: string) => {
    setSelectedMonth(month);
    setFilters(prev => ({ ...prev, month }));
  };

  // Fetch all user-isolated data from backend
  const loadUserData = useCallback(async () => {
    const token = getToken();
    if (!token || !user) {
      setTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      setInvestments([]);
      setEmergencyFund(DEFAULT_EMERGENCY_FUND);
      return;
    }

    setIsLoadingData(true);
    try {
      const [txRes, catRes, invRes, efRes] = await Promise.all([
        api.transactions.getAll().catch(() => ({ transactions: [] })),
        api.categories.getAll().catch(() => ({ categories: DEFAULT_CATEGORIES })),
        api.investments.getAll().catch(() => ({ investments: [] })),
        api.emergencyFund.get().catch(() => ({ emergencyFund: DEFAULT_EMERGENCY_FUND })),
      ]);

      setTransactions(txRes.transactions || []);
      if (catRes.categories && catRes.categories.length > 0) {
        setCategories(catRes.categories);
      }
      setInvestments(invRes.investments || []);
      if (efRes.emergencyFund) {
        setEmergencyFund(efRes.emergencyFund);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Transaction mutations
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const res = await api.transactions.create(data);
      if (res.transaction) {
        setTransactions(prev => [res.transaction, ...prev]);
      }
    } catch {
      // Offline / guest fallback
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      const res = await api.transactions.update(id, data);
      setTransactions(prev => prev.map(t => t.id === id ? res.transaction : t));
    } catch {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.transactions.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const bulkAddTransactions = async (data: Partial<Transaction>[]) => {
    try {
      const validItems = data
        .filter(t => t.description && t.amount !== undefined && t.date)
        .map(t => ({
          type: (t.type || 'expense') as 'income' | 'expense',
          description: t.description!,
          amount: Number(t.amount),
          date: t.date!,
          category: t.category || 'Outras Despesas',
          paymentMethod: (t.paymentMethod || 'other') as any,
          status: (t.status || 'completed') as any,
          notes: t.notes,
        }));

      await api.transactions.bulk(validItems);
      const res = await api.transactions.getAll();
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Error importing bulk transactions:', err);
    }
  };

  const clearAllTransactions = async () => {
    try {
      await api.transactions.clearAll();
      setTransactions([]);
    } catch {
      setTransactions([]);
    }
  };

  const loadSampleData = async () => {
    try {
      await bulkAddTransactions(SAMPLE_DEMO_TRANSACTIONS);
    } catch {
      // ignore
    }
  };

  // Category mutations
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const res = await api.categories.create(category);
      if (res.category) {
        setCategories(prev => [...prev, res.category]);
      }
    } catch {
      const newCat: Category = {
        ...category,
        id: `cat-${Date.now()}`,
      };
      setCategories(prev => [...prev, newCat]);
    }
  };

  // Investment mutations
  const addInvestment = async (asset: Omit<InvestmentAsset, 'id' | 'updatedAt'>) => {
    try {
      const res = await api.investments.create(asset);
      if (res.investment) {
        setInvestments(prev => [res.investment, ...prev]);
      }
    } catch {
      const newAsset: InvestmentAsset = {
        ...asset,
        id: `inv-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      setInvestments(prev => [newAsset, ...prev]);
    }
  };

  const updateInvestment = async (id: string, asset: Partial<InvestmentAsset>) => {
    try {
      const res = await api.investments.update(id, asset);
      setInvestments(prev => prev.map(i => i.id === id ? res.investment : i));
    } catch {
      setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...asset } : i));
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      await api.investments.delete(id);
      setInvestments(prev => prev.filter(i => i.id !== id));
    } catch {
      setInvestments(prev => prev.filter(i => i.id !== id));
    }
  };

  // Emergency Fund mutation
  const updateEmergencyFund = async (config: Partial<EmergencyFundConfig>) => {
    try {
      const res = await api.emergencyFund.update(config);
      if (res.emergencyFund) {
        setEmergencyFund(res.emergencyFund);
      }
    } catch {
      setEmergencyFund(prev => ({ ...prev, ...config }));
    }
  };

  // Monthly Summary Calculations
  const monthlySummary = useMemo<MonthlySummary>(() => {
    const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth));

    let totalIncome = 0;
    let totalExpense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;

    monthTx.forEach(t => {
      if (t.type === 'income') {
        if (t.status === 'completed') totalIncome += t.amount;
        else pendingIncome += t.amount;
      } else {
        if (t.status === 'completed') totalExpense += t.amount;
        else pendingExpense += t.amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      pendingIncome,
      pendingExpense,
      transactionCount: monthTx.length,
    };
  }, [transactions, selectedMonth]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filters.month && !tx.date.startsWith(filters.month)) return false;
      if (filters.type && filters.type !== 'all' && tx.type !== filters.type) return false;
      if (filters.category && tx.category !== filters.category) return false;
      if (filters.status && filters.status !== 'all' && tx.status !== filters.status) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        if (!matchesDesc && !matchesCat && !matchesNotes) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  // Available unique months list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(getCurrentMonth());
    transactions.forEach(t => {
      const ym = t.date.substring(0, 7);
      if (ym.length === 7) set.add(ym);
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        investments,
        emergencyFund,
        selectedMonth,
        setSelectedMonth: handleSetSelectedMonth,
        filters,
        setFilters,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        bulkAddTransactions,
        clearAllTransactions,
        loadSampleData,
        monthlySummary,
        filteredTransactions,
        availableMonths,
        addCategory,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        updateEmergencyFund,
        isLoadingData,
        reloadAllData: loadUserData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
