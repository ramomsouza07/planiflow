import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { monthlySummary } = useFinance();
  const { 
    totalIncome, 
    totalExpense, 
    balance, 
    savingsRate, 
    pendingIncome, 
    pendingExpense,
    transactionCount 
  } = monthlySummary;

  const isPositive = balance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Saldo Líquido Card */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg shadow-black/20 hover:border-slate-700 transition group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saldo do Mês
          </span>
          <div className={`p-2 rounded-xl ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(balance)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {isPositive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Superávit mensal</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Atenção: Gastos superando receitas</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>{transactionCount} {transactionCount === 1 ? 'registro' : 'registros'} neste mês</span>
          <span className="text-slate-500">Balanço líquido</span>
        </div>
      </div>

      {/* Total Entradas Card */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg shadow-black/20 hover:border-slate-700 transition group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Entradas
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-extrabold tracking-tight font-mono text-white">
            {formatCurrency(totalIncome)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">Receitas recebidas e a receber</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pendente:</span>
          </div>
          <span className="font-mono text-amber-400 font-semibold">{formatCurrency(pendingIncome)}</span>
        </div>
      </div>

      {/* Total Saídas Card */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg shadow-black/20 hover:border-slate-700 transition group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Saídas
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-extrabold tracking-tight font-mono text-rose-200">
            {formatCurrency(totalExpense)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span className="text-rose-400 font-medium">Despesas e compromissos</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>A pagar:</span>
          </div>
          <span className="font-mono text-amber-400 font-semibold">{formatCurrency(pendingExpense)}</span>
        </div>
      </div>

      {/* Taxa de Economia Card */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg shadow-black/20 hover:border-slate-700 transition group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Taxa de Poupança
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold tracking-tight font-mono text-indigo-300">
              {savingsRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">da renda retida</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                savingsRate >= 20 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                savingsRate > 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Meta recomendada: 20%</span>
          <span className={savingsRate >= 20 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
            {savingsRate >= 20 ? 'Excelente! 🚀' : 'Oportunidade 💡'}
          </span>
        </div>
      </div>

    </div>
  );
};
