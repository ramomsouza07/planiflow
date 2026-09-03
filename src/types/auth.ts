export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  monthlyIncomeEstimate?: number;
  preferredCurrency?: 'BRL' | 'USD' | 'EUR';
  savingsGoalPercentage?: number; // e.g. 20 for 20%
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
