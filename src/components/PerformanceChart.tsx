import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

type TimeRange = '1D' | '1W' | '1M' | '6M' | '1A';

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[#141824] border border-[#232a3d] rounded-xl px-3 py-2 shadow-2xl text-xs space-y-0.5">
        <div className="text-[10px] text-slate-400 font-medium">{label}</div>
        <div className="font-mono font-bold text-white text-sm">
          {formatCurrency(val)}
        </div>
        <div className="text-[10px] text-brand-blue font-semibold">
          Saldo Acumulado
        </div>
      </div>
    );
  }
  return null;
};

export const PerformanceChart: React.FC = () => {
  const { transactions, selectedMonth } = useFinance();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  // Dynamically compute chart points based on the active timeRange
  const chartData = useMemo(() => {
    const [yearNum, monthNum] = selectedMonth.split('-').map(Number);

    if (timeRange === '1D') {
      // Intraday / Today slot division
      const today = new Date().toISOString().split('T')[0];
      const todayTx = transactions.filter(t => t.date === today);

      let running = 0;
      const slots = [
        { label: '06:00', filter: (t: any) => (t.createdAt || '').includes('T06') || (t.createdAt || '').includes('T07') },
        { label: '12:00', filter: (t: any) => (t.createdAt || '').includes('T10') || (t.createdAt || '').includes('T11') || (t.createdAt || '').includes('T12') },
        { label: '18:00', filter: (t: any) => (t.createdAt || '').includes('T16') || (t.createdAt || '').includes('T17') || (t.createdAt || '').includes('T18') },
        { label: '23:59', filter: () => true },
      ];

      return slots.map(slot => {
        todayTx.forEach(tx => {
          if (slot.filter(tx)) {
            running += tx.type === 'income' ? tx.amount : -tx.amount;
          }
        });
        return {
          day: slot.label,
          saldo: running,
        };
      });
    }

    if (timeRange === '1W') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
        days.push({ iso, label: dayLabel });
      }

      let running = 0;
      return days.map(d => {
        const dayTxs = transactions.filter(t => t.date === d.iso);
        dayTxs.forEach(t => {
          running += t.type === 'income' ? t.amount : -t.amount;
        });
        return {
          day: d.label,
          saldo: running,
        };
      });
    }

    if (timeRange === '1M') {
      // Days in selected month
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const monthTxs = transactions.filter(t => t.date.startsWith(selectedMonth));

      const dayMap: Record<number, number> = {};
      for (let i = 1; i <= daysInMonth; i++) dayMap[i] = 0;

      monthTxs.forEach(t => {
        const day = parseInt(t.date.split('-')[2], 10);
        if (dayMap[day] !== undefined) {
          dayMap[day] += t.type === 'income' ? t.amount : -t.amount;
        }
      });

      let running = 0;
      return Object.entries(dayMap).map(([dayStr, net]) => {
        running += net;
        return {
          day: `${dayStr.padStart(2, '0')}/${String(monthNum).padStart(2, '0')}`,
          saldo: running,
        };
      });
    }

    if (timeRange === '6M') {
      // Last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(yearNum, monthNum - 1 - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const mLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
        months.push({ key: mKey, label: mLabel });
      }

      let running = 0;
      return months.map(m => {
        const mTxs = transactions.filter(t => t.date.startsWith(m.key));
        mTxs.forEach(t => {
          running += t.type === 'income' ? t.amount : -t.amount;
        });
        return {
          day: m.label,
          saldo: running,
        };
      });
    }

    if (timeRange === '1A') {
      // Last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(yearNum, monthNum - 1 - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const mLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
        months.push({ key: mKey, label: mLabel });
      }

      let running = 0;
      return months.map(m => {
        const mTxs = transactions.filter(t => t.date.startsWith(m.key));
        mTxs.forEach(t => {
          running += t.type === 'income' ? t.amount : -t.amount;
        });
        return {
          day: m.label,
          saldo: running,
        };
      });
    }

    return [];
  }, [transactions, selectedMonth, timeRange]);

  return (
    <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Header with Title and Range Pills matching ref.jpg */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Evolução do Saldo
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Comportamento do fluxo de caixa ({timeRange === '1D' ? 'Hoje' : timeRange === '1W' ? 'Últimos 7 dias' : timeRange === '1M' ? 'Mês selecionado' : timeRange === '6M' ? 'Últimos 6 meses' : 'Último ano'})
          </p>
        </div>

        {/* Time Pills matching ref.jpg (1D, 1W, 1M, 6M, 1A) */}
        <div className="flex items-center bg-[#131622] border border-[#202638] rounded-full p-1 self-start sm:self-auto">
          {(['1D', '1W', '1M', '6M', '1A'] as TimeRange[]).map((pill) => (
            <button
              key={pill}
              onClick={() => setTimeRange(pill)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                timeRange === pill
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart matching the blue wave in ref.jpg */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="refBlueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0066ff" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#0066ff" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#0066ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              stroke="#404b66" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#404b66" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#0066ff"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#refBlueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-2 text-xs text-slate-500">
          Nenhum lançamento cadastrado no histórico.
        </div>
      )}

    </div>
  );
};
