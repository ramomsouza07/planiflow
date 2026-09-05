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
  { id: 'salario', name: 'Salário & Renda Fixa', type: 'income', color: '#00d284', icon: 'Briefcase' },
  { id: 'freelance', name: 'Freelance & Projetos', type: 'income', color: '#10b981', icon: 'Laptop' },
  { id: 'investimentos-in', name: 'Rendimentos & Dividendos', type: 'income', color: '#34d399', icon: 'TrendingUp' },
  { id: 'vendas', name: 'Vendas & Reembolsos', type: 'income', color: '#f59e0b', icon: 'Tag' },
  { id: 'outras-entradas', name: 'Outras Entradas', type: 'income', color: '#059669', icon: 'Wallet' },

  // Saídas
  { id: 'moradia', name: 'Moradia & Aluguel', type: 'expense', color: '#ffa800', icon: 'Home' },
  { id: 'alimentacao', name: 'Alimentação & Supermercado', type: 'expense', color: '#ff4d6a', icon: 'Utensils' },
  { id: 'transporte', name: 'Transporte & Combustível', type: 'expense', color: '#00c4df', icon: 'Car' },
  { id: 'saude', name: 'Saúde & Farmácia', type: 'expense', color: '#9b51e0', icon: 'HeartPulse' },
  { id: 'lazer', name: 'Lazer & Entretenimento', type: 'expense', color: '#0066ff', icon: 'Film' },
  { id: 'educacao', name: 'Educação & Cursos', type: 'expense', color: '#60a5fa', icon: 'GraduationCap' },
  { id: 'assinaturas', name: 'Assinaturas & Serviços', type: 'expense', color: '#14b8a6', icon: 'CreditCard' },
  { id: 'compras', name: 'Compras Pessoais', type: 'expense', color: '#a855f7', icon: 'ShoppingBag' },
  { id: 'investimentos-aportes', name: 'Aporte Investimentos / Reserva', type: 'expense', color: '#3b82f6', icon: 'PiggyBank' },
  { id: 'outras-despesas', name: 'Outras Despesas', type: 'expense', color: '#64748b', icon: 'MinusCircle' },
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
