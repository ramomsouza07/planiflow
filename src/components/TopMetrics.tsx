import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  PiggyBank, 
  Clock, 
  ArrowRight
} from 'lucide-react';

interface TopMetricsProps {
  onGoToOperacoes?: () => void;
}

export const TopMetrics: React.FC<TopMetricsProps> = ({ onGoToOperacoes }) => {
  const { monthlySummary, selectedMonth } = useFinance();
  const { 
    totalIncome, 
    totalExpense, 
    balance, 
    savingsRate, 
    pendingExpense 
  } = monthlySummary;

  const isPositive = balance >= 0;
  const returnPercentage = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* 1. Total Holding Card (Left Side, ~4 cols) matching ref.jpg */}
      <div className="lg:col-span-4 bg-[#11141e] border border-[#1d2232] rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
        
        {/* Header row with Title and Pill */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">
            Saldo em Caixa
          </span>
          <span className="text-[11px] font-semibold text-slate-300 bg-[#191e2c] border border-[#232a3d] px-2.5 py-0.5 rounded-full capitalize">
            {selectedMonth}
          </span>
        </div>

        {/* Big Amount */}
        <div className="my-4">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            {formatCurrency(balance)}
          </div>
        </div>

        {/* Return Badge matching ref.jpg */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Balanço:</span>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
            isPositive 
              ? 'bg-[#00d284]/15 text-[#00d284] border border-[#00d284]/30' 
              : 'bg-[#ff4d6a]/15 text-[#ff4d6a] border border-[#ff4d6a]/30'
          }`}>
            <ArrowUpRight className={`w-3 h-3 ${!isPositive ? 'rotate-90' : ''}`} />
            <span>{isPositive ? `+${returnPercentage}%` : `${returnPercentage}%`}</span>
            <span className="text-slate-400 font-normal">({formatCurrency(balance)})</span>
          </div>
        </div>

      </div>

      {/* 2. My Portfolio Horizontal Cards (Right Side, ~8 cols) matching ref.jpg */}
      <div className="lg:col-span-8 bg-[#11141e] border border-[#1d2232] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
        
        {/* Header row with title and action button matching ref.jpg */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400">
            Resumo Operacional
          </span>
          <button
            onClick={onGoToOperacoes}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white bg-[#191e2c] hover:bg-[#202738] border border-[#232a3d] px-3 py-1 rounded-full transition cursor-pointer"
          >
            <span>Central de Operações</span>
            <ArrowRight className="w-3 h-3 text-brand-blue" />
          </button>
        </div>

        {/* Grid of mini cards matching the Apple / Tesla cards in ref.jpg */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Entradas */}
          <div className="bg-[#151926] border border-[#202638] rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[11px] font-medium">Entradas</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#00d284]" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
              {formatCurrency(totalIncome)}
            </div>
            <div className="mt-2 text-[10px] font-semibold text-[#00d284]">
              {totalIncome > 0 ? '+100% receitas' : 'R$ 0,00'}
            </div>
          </div>

          {/* Saídas */}
          <div className="bg-[#151926] border border-[#202638] rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[11px] font-medium">Saídas</span>
              <TrendingDown className="w-3.5 h-3.5 text-[#ff4d6a]" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-200 tracking-tight">
              {formatCurrency(totalExpense)}
            </div>
            <div className="mt-2 text-[10px] font-semibold text-[#ff4d6a]">
              {totalExpense > 0 ? `-${totalExpense.toFixed(0)} debitados` : 'R$ 0,00'}
            </div>
          </div>

          {/* Poupança */}
          <div className="bg-[#151926] border border-[#202638] rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[11px] font-medium">Poupança</span>
              <PiggyBank className="w-3.5 h-3.5 text-brand-blue" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
              {savingsRate.toFixed(1)}%
            </div>
            <div className="mt-2 text-[10px] font-semibold text-slate-400">
              {savingsRate >= 20 ? 'Meta atingida' : 'Taxa mensal'}
            </div>
          </div>

          {/* Pendentes */}
          <div className="bg-[#151926] border border-[#202638] rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[11px] font-medium">A Pagar</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-amber-300 tracking-tight">
              {formatCurrency(pendingExpense)}
            </div>
            <div className="mt-2 text-[10px] font-semibold text-slate-400">
              Pendente
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
