import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  Transaction, 
  Category, 
  FilterOptions, 
  MonthlySummary, 
  InvestmentAsset, 
  EmergencyFundConfig,
  CreditCard,
  FinancialGoal,
  RecurringBill,
  FinancialHealthScore
} from '../types/finance';
import { DEFAULT_CATEGORIES } from '../types/finance';
import { 
  SAMPLE_DEMO_TRANSACTIONS, 
  SAMPLE_DEMO_CARDS, 
  SAMPLE_DEMO_GOALS, 
  SAMPLE_DEMO_BILLS 
} from '../utils/initialData';
import { getCurrentMonth } from '../utils/formatters';
import { calculateFinancialScore } from '../utils/scoreCalculator';
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

  // 1. Cartões de Crédito
  creditCards: CreditCard[];
  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt'>) => Promise<void>;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addInstallmentTransaction: (
    baseData: Omit<Transaction, 'id' | 'createdAt'>,
    installments: number,
    cardId?: string
  ) => Promise<void>;

  // 3. Metas Financeiras
  goals: FinancialGoal[];
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number, isWithdrawal?: boolean) => Promise<void>;

  // 4. Contas Fixas & Assinaturas
  recurringBills: RecurringBill[];
  addRecurringBill: (bill: Omit<RecurringBill, 'id' | 'createdAt'>) => Promise<void>;
  updateRecurringBill: (id: string, bill: Partial<RecurringBill>) => Promise<void>;
  deleteRecurringBill: (id: string) => Promise<void>;
  markBillAsPaid: (id: string, payDate?: string) => Promise<void>;

  // 7. Score de Saúde Financeira
  financialScore: FinancialHealthScore;
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

  // User-scoped LocalStorage Keys
  const cardsStorageKey = useMemo(() => user ? `finflow_cards_${user.id}` : 'finflow_cards_guest', [user]);
  const goalsStorageKey = useMemo(() => user ? `finflow_goals_${user.id}` : 'finflow_goals_guest', [user]);
  const billsStorageKey = useMemo(() => user ? `finflow_bills_${user.id}` : 'finflow_bills_guest', [user]);

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem('finflow_cards_guest');
      return saved ? JSON.parse(saved) : SAMPLE_DEMO_CARDS;
    } catch {
      return SAMPLE_DEMO_CARDS;
    }
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const saved = localStorage.getItem('finflow_goals_guest');
      return saved ? JSON.parse(saved) : SAMPLE_DEMO_GOALS;
    } catch {
      return SAMPLE_DEMO_GOALS;
    }
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    try {
      const saved = localStorage.getItem('finflow_bills_guest');
      return saved ? JSON.parse(saved) : SAMPLE_DEMO_BILLS;
    } catch {
      return SAMPLE_DEMO_BILLS;
    }
  });

  // Rehydrate on user change
  useEffect(() => {
    try {
      const savedCards = localStorage.getItem(cardsStorageKey);
      if (savedCards) setCreditCards(JSON.parse(savedCards));
      else if (!user) setCreditCards(SAMPLE_DEMO_CARDS);

      const savedGoals = localStorage.getItem(goalsStorageKey);
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      else if (!user) setGoals(SAMPLE_DEMO_GOALS);

      const savedBills = localStorage.getItem(billsStorageKey);
      if (savedBills) setRecurringBills(JSON.parse(savedBills));
      else if (!user) setRecurringBills(SAMPLE_DEMO_BILLS);
    } catch (e) {
      console.warn('Error reading stored cards/goals/bills:', e);
    }
  }, [cardsStorageKey, goalsStorageKey, billsStorageKey, user]);

  // Persist mutations
  useEffect(() => {
    try {
      localStorage.setItem(cardsStorageKey, JSON.stringify(creditCards));
    } catch {}
  }, [creditCards, cardsStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(goalsStorageKey, JSON.stringify(goals));
    } catch {}
  }, [goals, goalsStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(billsStorageKey, JSON.stringify(recurringBills));
    } catch {}
  }, [recurringBills, billsStorageKey]);

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
      setCreditCards(SAMPLE_DEMO_CARDS);
      setGoals(SAMPLE_DEMO_GOALS);
      setRecurringBills(SAMPLE_DEMO_BILLS);
    } catch {
      // ignore
    }
  };

  // 1. Credit Cards mutations
  const addCreditCard = async (card: Omit<CreditCard, 'id' | 'createdAt'>) => {
    const newCard: CreditCard = {
      ...card,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCreditCards(prev => [...prev, newCard]);
  };

  const updateCreditCard = async (id: string, data: Partial<CreditCard>) => {
    setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCreditCard = async (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  const addInstallmentTransaction = async (
    baseData: Omit<Transaction, 'id' | 'createdAt'>,
    installments: number,
    cardId?: string
  ) => {
    const count = Math.max(1, Math.min(60, installments));
    const totalAmount = baseData.amount;
    const installmentAmount = Math.round((totalAmount / count) * 100) / 100;
    const groupId = `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const [startYear, startMonth, startDay] = baseData.date.split('-').map(Number);
    const generatedTxs: Omit<Transaction, 'id' | 'createdAt'>[] = [];

    for (let i = 1; i <= count; i++) {
      const targetDate = new Date(startYear, startMonth - 1 + (i - 1), startDay);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(Math.min(startDay, 28)).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      generatedTxs.push({
        ...baseData,
        description: count > 1 ? `${baseData.description} (${i}/${count})` : baseData.description,
        amount: installmentAmount,
        date: dateStr,
        paymentMethod: 'credit',
        cardId: cardId || undefined,
        installmentCurrent: i,
        installmentTotal: count,
        installmentGroupId: groupId,
      });
    }

    if (generatedTxs.length === 1) {
      await addTransaction(generatedTxs[0]);
    } else {
      await bulkAddTransactions(generatedTxs);
    }
  };

  // 3. Goals mutations
  const addGoal = async (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = async (id: string, data: Partial<FinancialGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data, updatedAt: new Date().toISOString() } : g));
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = async (id: string, amount: number, isWithdrawal: boolean = false) => {
    const targetGoal = goals.find(g => g.id === id);
    if (!targetGoal) return;

    const delta = isWithdrawal ? -Math.abs(amount) : Math.abs(amount);
    const nextAmount = Math.max(0, targetGoal.currentAmount + delta);

    await updateGoal(id, { currentAmount: nextAmount });

    // Register transaction associated with this goal
    await addTransaction({
      type: isWithdrawal ? 'income' : 'expense',
      description: isWithdrawal ? `Resgate Meta: ${targetGoal.title}` : `Aporte Meta: ${targetGoal.title}`,
      amount: Math.abs(amount),
      date: new Date().toISOString().split('T')[0],
      category: 'Aporte Investimentos / Reserva',
      paymentMethod: 'pix',
      status: 'completed',
      notes: `Movimentação da meta "${targetGoal.title}"`,
    });
  };

  // 4. Recurring Bills mutations
  const addRecurringBill = async (bill: Omit<RecurringBill, 'id' | 'createdAt'>) => {
    const newBill: RecurringBill = {
      ...bill,
      id: `bill-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRecurringBills(prev => [...prev, newBill]);
  };

  const updateRecurringBill = async (id: string, data: Partial<RecurringBill>) => {
    setRecurringBills(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteRecurringBill = async (id: string) => {
    setRecurringBills(prev => prev.filter(b => b.id !== id));
  };

  const markBillAsPaid = async (id: string, payDate?: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (!bill) return;

    const today = payDate || new Date().toISOString().split('T')[0];
    await updateRecurringBill(id, { lastPaidDate: today });

    // Automatically create transaction
    await addTransaction({
      type: 'expense',
      description: `${bill.name} (Assinatura)`,
      amount: bill.amount,
      date: today,
      category: bill.category || 'Assinaturas & Serviços',
      paymentMethod: bill.paymentMethod || 'credit',
      cardId: bill.cardId,
      status: 'completed',
      isRecurring: true,
      recurringBillId: bill.id,
      notes: 'Pagamento recorrente confirmado',
    });
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

  // 7. Dynamic Financial Score
  const financialScore = useMemo(() => {
    return calculateFinancialScore({
      transactions,
      monthlySummary,
      emergencyFund,
      creditCards,
      recurringBills,
      monthlyIncomeEstimate: user?.monthlyIncomeEstimate || 0,
    });
  }, [transactions, monthlySummary, emergencyFund, creditCards, recurringBills, user]);

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

        // 1. Cartões de Crédito
        creditCards,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addInstallmentTransaction,

        // 3. Metas Financeiras
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,

        // 4. Contas Fixas & Assinaturas
        recurringBills,
        addRecurringBill,
        updateRecurringBill,
        deleteRecurringBill,
        markBillAsPaid,

        // 7. Score de Saúde Financeira
        financialScore,
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
