import type { Transaction } from '../types/finance';

// Array vazio por padrão - sem dados fictícios
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Dados opcionais apenas se o usuário desejar carregar exemplo
export const SAMPLE_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-1',
    type: 'income',
    description: 'Salário Mensal',
    amount: 5500.00,
    date: '2026-09-01',
    category: 'Salário',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'demo-2',
    type: 'expense',
    description: 'Aluguel',
    amount: 1800.00,
    date: '2026-09-05',
    category: 'Moradia (Aluguel, Contas)',
    paymentMethod: 'pix',
    status: 'completed',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'demo-3',
    type: 'expense',
    description: 'Supermercado',
    amount: 650.00,
    date: '2026-09-02',
    category: 'Alimentação & Mercado',
    paymentMethod: 'credit',
    status: 'completed',
    createdAt: '2026-09-02T18:00:00.000Z',
  }
];
