import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  AreaChart, 
  Area,
  CartesianGrid
} from 'recharts';
import { PieChart as PieIcon, LineChart as LineIcon, BarChart3, TrendingDown, Layers } from 'lucide-react';

const CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#10B981', '#06B6D4', 
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
  '#A855F7', '#F43F5E', '#84CC16', '#64748B'
];

// Custom Dark Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50">
        <p className="font-semibold text-slate-300 pb-1 border-b border-slate-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50">
        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="font-semibold text-slate-200">{data.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-0.5">
          <span className="text-slate-400">Total:</span>
          <span className="font-mono font-bold text-white">{formatCurrency(data.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Proporção:</span>
          <span className="font-mono font-bold text-emerald-400">{data.payload.percentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ChartsSection: React.FC = () => {
  const { filteredTransactions, selectedMonth, monthlySummary } = useFinance();
  const [chartView, setChartView] = useState<'daily' | 'categories' | 'comparison'>('daily');

  // Daily evolution data for current month
  const dailyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Group transactions by day
    const dayMap: Record<number, { day: string; entrada: number; saida: number; saldo: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      dayMap[d] = {
        day: `${dayStr}/${String(month).padStart(2, '0')}`,
        entrada: 0,
        saida: 0,
        saldo: 0,
      };
    }

    filteredTransactions.forEach(tx => {
      const day = parseInt(tx.date.split('-')[2], 10);
      if (dayMap[day]) {
        if (tx.type === 'income') {
          dayMap[day].entrada += tx.amount;
        } else {
          dayMap[day].saida += tx.amount;
        }
      }
    });

    let cumulative = 0;
    return Object.values(dayMap).map(item => {
      cumulative += (item.entrada - item.saida);
      return {
        ...item,
        saldo: cumulative,
      };
    });
  }, [filteredTransactions, selectedMonth]);

  // Expenses by category
  const expenseCategoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        totalExpense += t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Incomes by category
  const incomeCategoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let totalIncome = 0;

    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        totalIncome += t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalIncome > 0 ? (value / totalIncome) * 100 : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 lg:p-6 shadow-xl space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Análise Visual & Gráficos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe a distribuição e o comportamento financeiro ao longo do mês
          </p>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/70">
          <button
            onClick={() => setChartView('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              chartView === 'daily'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Fluxo Diário</span>
          </button>

          <button
            onClick={() => setChartView('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              chartView === 'categories'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Por Categorias</span>
          </button>

          <button
            onClick={() => setChartView('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              chartView === 'comparison'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Entrada x Saída</span>
          </button>
        </div>
      </div>

      {/* View 1: Fluxo Diário (Área / Barras) */}
      {chartView === 'daily' && (
        <div className="space-y-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `R$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="entrada" 
                  name="Entrada" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEntrada)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="saida" 
                  name="Saída" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSaida)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Entradas diárias</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Saídas diárias</span>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Distribuição por Categorias */}
      {chartView === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Saídas por Categoria */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Gastos por Categoria
            </h4>

            {expenseCategoryData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                Nenhum gasto registrado neste período.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2 w-full max-h-48 overflow-y-auto pr-1">
                  {expenseCategoryData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-300 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
                        <span className="text-slate-400 text-[10px]">({cat.percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Entradas por Categoria */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Fontes de Renda
            </h4>

            {incomeCategoryData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                Nenhuma entrada registrada neste período.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {incomeCategoryData.map((entry, index) => (
                          <Cell key={`cell-in-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2 w-full max-h-48 overflow-y-auto pr-1">
                  {incomeCategoryData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-300 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
                        <span className="text-slate-400 text-[10px]">({cat.percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* View 3: Comparativo Entrada x Saída */}
      {chartView === 'comparison' && (
        <div className="space-y-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Balanço Mensal',
                    Entradas: monthlySummary.totalIncome,
                    Saídas: monthlySummary.totalExpense,
                  },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>} 
                />
                <Bar dataKey="Entradas" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={90} />
                <Bar dataKey="Saídas" fill="#EF4444" radius={[8, 8, 0, 0]} maxBarSize={90} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-around gap-2 text-slate-400">
            <div>
              Entradas: <span className="font-mono text-emerald-400 font-bold">{formatCurrency(monthlySummary.totalIncome)}</span>
            </div>
            <div>
              Saídas: <span className="font-mono text-rose-400 font-bold">{formatCurrency(monthlySummary.totalExpense)}</span>
            </div>
            <div>
              Margem de Sobra: <span className={`font-mono font-bold ${monthlySummary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(monthlySummary.balance)}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
