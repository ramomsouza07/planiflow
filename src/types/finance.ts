export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'pix'
  | 'credit'
  | 'debit'
  | 'cash'
  | 'transfer'
  | 'other';

export type TransactionStatus = 'completed' | 'pending';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  cardId?: string;
  installmentCurrent?: number;
  installmentTotal?: number;
  installmentGroupId?: string;
  isRecurring?: boolean;
  recurringBillId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number; // percentage (income - expense) / income * 100
  pendingIncome: number;
  pendingExpense: number;
  transactionCount: number;
}

export interface FilterOptions {
  month: string; // YYYY-MM
  type?: TransactionType | 'all';
  category?: string;
  status?: TransactionStatus | 'all';
  searchQuery?: string;
}

export type InvestmentType = 'renda_fixa' | 'acoes' | 'fiis' | 'cripto' | 'reserva' | 'outros';

export interface InvestmentAsset {
  id: string;
  name: string;
  ticker?: string;
  type: InvestmentType;
  institution: string;
  totalInvested: number;
  currentValue: number;
  monthlyYield?: number;
  notes?: string;
  updatedAt: string;
}

export interface EmergencyFundConfig {
  targetMonths: number; // ex: 6 meses
  customTargetAmount?: number; // ou meta fixa em R$
  currentAmount: number; // saldo atual da reserva
  institution: string; // ex: "Tesouro Selic / NuConta"
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Entradas
  { id: 'salario', name: 'Salário', type: 'income', color: '#10B981', icon: 'Briefcase' },
  { id: 'freelance', name: 'Freelance & Bicos', type: 'income', color: '#06B6D4', icon: 'Laptop' },
  { id: 'investimentos-in', name: 'Rendimentos & Dividendos', type: 'income', color: '#8B5CF6', icon: 'TrendingUp' },
  { id: 'vendas', name: 'Vendas & Reembolsos', type: 'income', color: '#F59E0B', icon: 'Tag' },
  { id: 'outras-entradas', name: 'Outras Entradas', type: 'income', color: '#64748B', icon: 'PlusCircle' },

  // Saídas
  { id: 'moradia', name: 'Moradia (Aluguel, Contas)', type: 'expense', color: '#EF4444', icon: 'Home' },
  { id: 'alimentacao', name: 'Alimentação & Mercado', type: 'expense', color: '#F97316', icon: 'Utensils' },
  { id: 'transporte', name: 'Transporte & Combustível', type: 'expense', color: '#EAB308', icon: 'Car' },
  { id: 'saude', name: 'Saúde & Farmácia', type: 'expense', color: '#EC4899', icon: 'HeartPulse' },
  { id: 'lazer', name: 'Lazer & Entretenimento', type: 'expense', color: '#3B82F6', icon: 'Film' },
  { id: 'educacao', name: 'Educação & Cursos', type: 'expense', color: '#6366F1', icon: 'GraduationCap' },
  { id: 'assinaturas', name: 'Assinaturas & Serviços', type: 'expense', color: '#14B8A6', icon: 'CreditCard' },
  { id: 'compras', name: 'Compras Pessoais', type: 'expense', color: '#A855F7', icon: 'ShoppingBag' },
  { id: 'investimentos-aportes', name: 'Aporte Investimentos / Reserva', type: 'expense', color: '#0066FF', icon: 'PiggyBank' },
  { id: 'outras-saidas', name: 'Outras Saídas', type: 'expense', color: '#94A3B8', icon: 'MinusCircle' },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  cash: 'Dinheiro',
  transfer: 'Transferência / TED',
  other: 'Outro',
};

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  reserva: 'Reserva de Emergência',
  renda_fixa: 'Renda Fixa / Tesouro / CDB',
  acoes: 'Ações Nacionais / Internacionais',
  fiis: 'Fundos Imobiliários (FIIs)',
  cripto: 'Criptoativos',
  outros: 'Outros Investimentos',
};

// 1. Gestão de Cartões de Crédito & Faturas
export interface CreditCard {
  id: string;
  name: string; // ex: "Nubank Ultravioleta"
  institution: string; // ex: "Nubank"
  lastFourDigits?: string; // ex: "3489"
  limit: number; // Limite total
  closingDay: number; // Dia do fechamento da fatura (1-31)
  dueDay: number; // Dia de vencimento (1-31)
  color: string;
  brand?: 'mastercard' | 'visa' | 'elo' | 'amex' | 'other';
  createdAt?: string;
}

// 3. Metas Financeiras & Sonhos (Goals Tracker)
export interface FinancialGoal {
  id: string;
  title: string; // ex: "Viagem Europa 2027", "Entrada Apartamento"
  targetAmount: number; // Valor alvo
  currentAmount: number; // Valor acumulado
  deadline?: string; // Data limite YYYY-MM-DD
  category: string; // Viagem, Imóvel, Veículo, Educação, Independência, Outros
  color: string;
  icon?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 4. Contas Fixas & Assinaturas Recorrentes
export interface RecurringBill {
  id: string;
  name: string; // ex: "Netflix", "Aluguel", "Academia"
  amount: number;
  dueDay: number; // Dia do vencimento no mês (1-31)
  category: string;
  frequency: 'monthly' | 'yearly';
  paymentMethod: PaymentMethod;
  cardId?: string; // Vinculado a um cartão específico se for no crédito
  lastPaidDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
}

// 7. Score de Saúde Financeira (0 a 1000)
export interface ScorePillar {
  title: string;
  score: number;
  maxScore: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
  tip: string;
}

export interface FinancialHealthScore {
  totalScore: number; // 0 a 1000
  level: 'Crítico' | 'Regular' | 'Bom' | 'Excelente';
  levelColor: string;
  savingsPillar: ScorePillar;
  emergencyPillar: ScorePillar;
  budgetPillar: ScorePillar;
  creditDebtPillar: ScorePillar;
  recommendations: string[];
}
