import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Legend 
} from 'recharts';
import { 
  PieChart as PieIcon, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  PlusCircle, 
  Percent, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const EXPENSE_PALETTE = ['#FF4D6A', '#FFA800', '#FF7A00', '#E040FB', '#00C4DF', '#9B51E0', '#FF5252', '#F43F5E', '#8B5CF6'];
const INCOME_PALETTE = ['#00D284', '#0066FF', '#00E5FF', '#76FF03', '#AEEA00', '#10B981', '#38BDF8'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomPieTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#141824] border border-[#232a3d] rounded-xl px-3 py-2 shadow-2xl text-xs space-y-0.5">
        <div className="flex items-center gap-1.5 pb-0.5 border-b border-[#202638]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="font-semibold text-white">{data.name}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-400 pt-1">
          <span>Valor:</span>
          <span className="font-mono font-bold text-white">{formatCurrency(data.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span>Proporção:</span>
          <span className="font-mono font-bold text-brand-blue">{data.payload.percentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

interface AnalyticsViewProps {
  onGoToOperacoes?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onGoToOperacoes }) => {
  const { 
    transactions, 
    monthlySummary, 
    selectedMonth, 
    setSelectedMonth, 
    loadSampleData 
  } = useFinance();

  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');

  // Handle month navigation
  const handleMonthChange = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  // Transactions based on active view mode
  const activeTransactions = useMemo(() => {
    if (viewMode === 'all') {
      return transactions;
    }
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth, viewMode]);

  // Expenses by category
  const expenseData = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExpense = 0;

    activeTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
        totalExpense += t.amount;
      });

    return Object.entries(map).map(([name, value], index) => ({
      name,
      value,
      color: EXPENSE_PALETTE[index % EXPENSE_PALETTE.length],
      percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [activeTransactions]);

  // Income by category
  const incomeData = useMemo(() => {
    const map: Record<string, number> = {};
    let totalIncome = 0;

    activeTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
        totalIncome += t.amount;
      });

    return Object.entries(map).map(([name, value], index) => ({
      name,
      value,
      color: INCOME_PALETTE[index % INCOME_PALETTE.length],
      percentage: totalIncome > 0 ? (value / totalIncome) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [activeTransactions]);

  // Summary figures based on active view
  const summaryFigures = useMemo(() => {
    if (viewMode === 'month') {
      return monthlySummary;
    }
    const totalIncome = activeTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = activeTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
    };
  }, [viewMode, monthlySummary, activeTransactions]);

  // Overall Income vs Expense distribution
  const ratioData = useMemo(() => {
    const total = summaryFigures.totalIncome + summaryFigures.totalExpense;
    if (total === 0) return [];

    return [
      {
        name: 'Entradas (Receitas)',
        value: summaryFigures.totalIncome,
        color: '#00D284',
        percentage: (summaryFigures.totalIncome / total) * 100,
      },
      {
        name: 'Saídas (Despesas)',
        value: summaryFigures.totalExpense,
        color: '#FF4D6A',
        percentage: (summaryFigures.totalExpense / total) * 100,
      },
    ].filter(item => item.value > 0);
  }, [summaryFigures]);

  const handleActionClick = () => {
    if (onGoToOperacoes) {
      onGoToOperacoes();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-blue" />
            Análise Visual & Gráficos Percentuais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'month' 
              ? `Proporções de gastos, receitas e balanço consolidado de ${formatMonthYear(selectedMonth)}`
              : 'Visão histórica consolidada de todos os lançamentos'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-[#131622] p-1 rounded-xl border border-[#202638]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'month'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'all'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todo o Histórico
            </button>
          </div>

          {/* Month Navigator (visible when in month view) */}
          {viewMode === 'month' && (
            <div className="flex items-center bg-[#131622] border border-[#202638] rounded-xl p-1 shadow-inner">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1d2334] transition"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2.5 text-slate-200 capitalize select-none min-w-[100px] text-center">
                {formatMonthYear(selectedMonth)}
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1d2334] transition"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Total Receitas</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#00d284]" />
          </div>
          <div className="text-lg font-mono font-bold text-[#00d284]">
            {formatCurrency(summaryFigures.totalIncome)}
          </div>
          <span className="text-[10px] text-slate-500">{incomeData.length} categorias de entrada</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Total Despesas</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#ff4d6a]" />
          </div>
          <div className="text-lg font-mono font-bold text-[#ff4d6a]">
            {formatCurrency(summaryFigures.totalExpense)}
          </div>
          <span className="text-[10px] text-slate-500">{expenseData.length} categorias de saída</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Saldo Líquido</span>
            <Wallet className="w-3.5 h-3.5 text-brand-blue" />
          </div>
          <div className={`text-lg font-mono font-bold ${summaryFigures.balance >= 0 ? 'text-white' : 'text-[#ff4d6a]'}`}>
            {formatCurrency(summaryFigures.balance)}
          </div>
          <span className="text-[10px] text-slate-500">
            {summaryFigures.balance >= 0 ? 'Superávit no período' : 'Déficit no período'}
          </span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Taxa de Economia</span>
            <Percent className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">
            {summaryFigures.savingsRate ? `${summaryFigures.savingsRate.toFixed(1)}%` : '0.0%'}
          </div>
          <span className="text-[10px] text-slate-500">Do total de receitas retido</span>
        </div>
      </div>

      {activeTransactions.length === 0 ? (
        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-12 text-center text-slate-500 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#151926] border border-[#232a3d] flex items-center justify-center mx-auto text-slate-400">
            <AlertCircle className="w-7 h-7 text-brand-blue" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white mb-1">
              Nenhuma operação cadastrada {viewMode === 'month' ? `para ${formatMonthYear(selectedMonth)}` : 'no sistema'}
            </h3>
            <p className="text-xs text-slate-400">
              Cadastre suas receitas e despesas na tela de cadastro ou carregue dados de demonstração para visualizar os gráficos e percentuais.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              onClick={handleActionClick}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blueHover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Lançamento</span>
            </button>

            <button
              onClick={loadSampleData}
              className="flex items-center gap-2 px-4 py-2 bg-[#151926] hover:bg-[#1a2030] text-slate-300 hover:text-white border border-[#202638] rounded-xl text-xs font-semibold transition"
            >
              <Sliders className="w-4 h-4 text-brand-blue" />
              <span>Carregar Dados de Exemplo</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Row 1: Donut Gastos (Left) + Donut Receitas (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gastos por Categoria */}
            <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1b202e]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#FF4D6A]" />
                  Distribuição de Despesas por Categoria
                </h3>
                <span className="text-[11px] font-mono text-[#FF4D6A] font-bold">
                  {formatCurrency(summaryFigures.totalExpense)}
                </span>
              </div>

              {expenseData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">Sem despesas registradas no período.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-6 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-exp-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="sm:col-span-6 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {expenseData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#151926] transition">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-300 truncate font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
                          <span className="text-[#FF4D6A] font-bold text-[11px] bg-[#FF4D6A]/10 px-1.5 py-0.5 rounded">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Receitas por Categoria */}
            <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1b202e]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00D284]" />
                  Distribuição de Fontes de Entrada
                </h3>
                <span className="text-[11px] font-mono text-[#00D284] font-bold">
                  {formatCurrency(summaryFigures.totalIncome)}
                </span>
              </div>

              {incomeData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">Sem receitas registradas no período.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-6 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {incomeData.map((entry, index) => (
                            <Cell key={`cell-inc-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="sm:col-span-6 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {incomeData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#151926] transition">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-300 truncate font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
                          <span className="text-[#00D284] font-bold text-[11px] bg-[#00D284]/10 px-1.5 py-0.5 rounded">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Row 2: Proporção Entrada x Saída (Pie) + Balanço Geral (Bar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Proporção Geral Pizza */}
            <div className="lg:col-span-5 bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-brand-blue" />
                Proporção Global: Entrada x Saída
              </h3>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {ratioData.map((entry, index) => (
                        <Cell key={`cell-ratio-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#151926] p-3 rounded-xl border border-[#202638]">
                  <span className="text-slate-500 block text-[10px] font-medium">Entradas</span>
                  <span className="font-mono font-bold text-[#00D284] text-sm">
                    {summaryFigures.totalIncome > 0 
                      ? ((summaryFigures.totalIncome / (summaryFigures.totalIncome + summaryFigures.totalExpense)) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="bg-[#151926] p-3 rounded-xl border border-[#202638]">
                  <span className="text-slate-500 block text-[10px] font-medium">Saídas</span>
                  <span className="font-mono font-bold text-[#FF4D6A] text-sm">
                    {summaryFigures.totalExpense > 0 
                      ? ((summaryFigures.totalExpense / (summaryFigures.totalIncome + summaryFigures.totalExpense)) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Comparativo de Balanço */}
            <div className="lg:col-span-7 bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">
                Balanço Consolidado ({viewMode === 'month' ? formatMonthYear(selectedMonth) : 'Geral'})
              </h3>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Balanço',
                        Entradas: summaryFigures.totalIncome,
                        Saídas: summaryFigures.totalExpense,
                        Economia: Math.max(0, summaryFigures.balance),
                      },
                    ]}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val)), '']} 
                      contentStyle={{ backgroundColor: '#141824', borderColor: '#232a3d', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Entradas" fill="#00D284" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="Saídas" fill="#FF4D6A" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="Economia" fill="#0066FF" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-[#151926] rounded-xl border border-[#202638] text-xs flex justify-between items-center">
                <span className="text-slate-400">Saldo Líquido Retido:</span>
                <span className={`font-mono font-bold text-sm ${summaryFigures.balance >= 0 ? 'text-[#00D284]' : 'text-[#FF4D6A]'}`}>
                  {formatCurrency(summaryFigures.balance)}
                </span>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
