import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { Tag, PieChart as PieIcon, List } from 'lucide-react';

const PALETTE = [
  '#0066FF', '#00D284', '#FF4D6A', '#FFA800', '#9B51E0', 
  '#00C4DF', '#FF7A00', '#E040FB', '#00E5FF', '#76FF03'
];

const CustomPieTooltip = ({ active, payload }: any) => {
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

export const CategoryWatchlist: React.FC = () => {
  const { transactions, selectedMonth } = useFinance();
  const [tab, setTab] = useState<'expense' | 'income' | 'all'>('expense');
  const [displayMode, setDisplayMode] = useState<'chart' | 'list'>('chart');

  const categoryStats = useMemo(() => {
    const monthTxs = transactions.filter(t => t.date.startsWith(selectedMonth));
    const totals: Record<string, { name: string; amount: number; type: 'income' | 'expense' }> = {};

    let totalRelevant = 0;

    monthTxs.forEach(t => {
      if (tab === 'all' || t.type === tab) {
        totalRelevant += t.amount;
      }
      if (!totals[t.category]) {
        totals[t.category] = { name: t.category, amount: 0, type: t.type };
      }
      totals[t.category].amount += t.amount;
    });

    return Object.values(totals)
      .filter(item => (tab === 'all' ? true : item.type === tab))
      .map((item, index) => ({
        ...item,
        value: item.amount,
        color: PALETTE[index % PALETTE.length],
        percentage: totalRelevant > 0 ? (item.amount / totalRelevant) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonth, tab]);

  return (
    <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
      
      {/* Header & Display Toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Categorias & Porcentagens
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-[#131622] p-0.5 rounded-lg border border-[#202638]">
            <button
              onClick={() => setDisplayMode('chart')}
              className={`p-1 rounded ${displayMode === 'chart' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white'}`}
              title="Gráfico de Pizza/Rosca"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`p-1 rounded ${displayMode === 'list' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white'}`}
              title="Lista Detalhada"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-[#131622] border border-[#202638] rounded-full p-1 mb-4">
          <button
            onClick={() => setTab('expense')}
            className={`flex-1 py-1 rounded-full text-[10px] font-bold transition-all text-center ${
              tab === 'expense'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setTab('income')}
            className={`flex-1 py-1 rounded-full text-[10px] font-bold transition-all text-center ${
              tab === 'income'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-1 rounded-full text-[10px] font-bold transition-all text-center ${
              tab === 'all'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas
          </button>
        </div>

        {/* Content: Pie Chart or List */}
        {categoryStats.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <PieIcon className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
            Nenhuma operação cadastrada
          </div>
        ) : displayMode === 'chart' ? (
          <div className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Top Categories Badges with % */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {categoryStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-[#151926] transition">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 truncate font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className="font-semibold text-white">{formatCurrency(item.amount)}</span>
                    <span className="text-brand-blue font-bold text-[11px] bg-brand-blue/10 px-1.5 py-0.5 rounded">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {categoryStats.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#151926] transition"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate tracking-tight">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.type === 'expense' ? 'Despesa' : 'Receita'}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-white">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-[10px] font-bold text-brand-blue">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-3 border-t border-[#1b202e] text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-slate-500" />
          <span>Filtro</span>
        </div>
        <span className="capitalize text-slate-400 font-semibold">
          {tab === 'expense' ? 'Apenas Gastos' : tab === 'income' ? 'Apenas Entradas' : 'Todas as Operações'}
        </span>
      </div>

    </div>
  );
};
