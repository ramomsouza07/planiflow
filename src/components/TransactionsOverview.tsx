import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction, TransactionType, PaymentMethod, TransactionStatus } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cleanText } from '../utils/clientEncryption';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  FolderPlus,
  Inbox
} from 'lucide-react';

interface TransactionsOverviewProps {
  onEditTransaction: (tx: Transaction) => void;
  onGoToOperacoes?: () => void;
}

export const TransactionsOverview: React.FC<TransactionsOverviewProps> = ({
  onEditTransaction,
  onGoToOperacoes,
}) => {
  const { 
    filteredTransactions, 
    deleteTransaction, 
    addTransaction, 
    categories,
    filters,
    setFilters 
  } = useFinance();

  // Quick inline add
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickType, setQuickType] = useState<TransactionType>('expense');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quickCategory, setQuickCategory] = useState('');

  const activeTab = filters.type || 'all';

  const handleTabChange = (type: TransactionType | 'all') => {
    setFilters(prev => ({ ...prev, type }));
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(quickAmount.replace(',', '.'));
    if (!quickDesc.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const availableCats = categories.filter(c => c.type === quickType);
    const defaultCat = availableCats[0]?.name || (quickType === 'income' ? 'Salário' : 'Outras Saídas');

    addTransaction({
      type: quickType,
      description: quickDesc.trim(),
      amount: amountNum,
      date: quickDate,
      category: quickCategory || defaultCat,
      paymentMethod: 'pix' as PaymentMethod,
      status: 'completed' as TransactionStatus,
    });

    setQuickDesc('');
    setQuickAmount('');
  };

  return (
    <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl shadow-xl overflow-hidden flex flex-col">
      
      {/* Header with Title and Filter Pills matching ref.jpg */}
      <div className="p-4 sm:p-5 border-b border-[#1b202e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Lançamentos Operados
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            ({filteredTransactions.length})
          </span>
        </div>

        {/* Right side: Pills matching [All, Gainers, Losers] in ref.jpg + Quick Add Toggle */}
        <div className="flex items-center gap-2">
          
          <div className="flex items-center bg-[#131622] border border-[#202638] rounded-full p-1">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleTabChange('income')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeTab === 'income'
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => handleTabChange('expense')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeTab === 'expense'
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Saídas
            </button>
          </div>

          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className={`p-1.5 rounded-full border transition ${
              isQuickAddOpen 
                ? 'bg-brand-blue text-white border-brand-blue' 
                : 'bg-[#151926] text-slate-400 border-[#202638] hover:text-white'
            }`}
            title="Adicionar linha rápida"
          >
            <Plus className={`w-3.5 h-3.5 transition-transform ${isQuickAddOpen ? 'rotate-45' : ''}`} />
          </button>

        </div>
      </div>

      {/* Quick Add Row in minimalist style */}
      {isQuickAddOpen && (
        <form 
          onSubmit={handleQuickAdd}
          className="bg-[#0b0e17] border-b border-[#1b202e] p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center animate-fade-in"
        >
          <div className="sm:col-span-2 flex rounded-lg overflow-hidden border border-[#202638]">
            <button
              type="button"
              onClick={() => setQuickType('expense')}
              className={`flex-1 py-1 text-[11px] font-bold ${quickType === 'expense' ? 'bg-[#ff4d6a] text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Saída
            </button>
            <button
              type="button"
              onClick={() => setQuickType('income')}
              className={`flex-1 py-1 text-[11px] font-bold ${quickType === 'income' ? 'bg-[#00d284] text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Entrada
            </button>
          </div>

          <div className="sm:col-span-4">
            <input
              type="text"
              required
              placeholder="O que foi operado (descrição)..."
              value={quickDesc}
              onChange={(e) => setQuickDesc(e.target.value)}
              className="w-full bg-[#131622] border border-[#202638] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="number"
              step="0.01"
              required
              placeholder="Valor R$"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              className="w-full bg-[#131622] border border-[#202638] rounded-lg px-2.5 py-1 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              required
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="w-full bg-[#131622] border border-[#202638] rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-1">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="flex-1 bg-[#131622] border border-[#202638] rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              {categories.filter(c => c.type === quickType).map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="p-1.5 bg-brand-blue hover:bg-brand-blueHover text-white rounded-lg transition shrink-0"
              title="Salvar"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Minimal Table matching ref.jpg */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-[#1b202e] select-none">
              <th className="py-3 px-4">Operação</th>
              <th className="py-3 px-4">Quanto (Valor)</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Quando</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181c28]">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-400">Nenhuma operação cadastrada</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Comece adicionando uma entrada ou saída para gerenciar seu mês.</p>
                  {onGoToOperacoes && (
                    <button
                      onClick={onGoToOperacoes}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-blue text-white shadow-md hover:bg-brand-blueHover transition cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Cadastrar na Central de Operações</span>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr 
                    key={tx.id}
                    className="hover:bg-[#141824] transition-colors group"
                  >
                    {/* Operação / Icon + Name matching Apple/Tesla row style */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isIncome 
                            ? 'bg-[#00d284]/10 text-[#00d284] border border-[#00d284]/20' 
                            : 'bg-[#ff4d6a]/10 text-[#ff4d6a] border border-[#ff4d6a]/20'
                        }`}>
                          {isIncome ? '+' : '-'}
                        </div>
                        <div>
                          <div className="font-semibold text-white tracking-tight">{cleanText(tx.description, 'Lançamento')}</div>
                          {tx.notes && <div className="text-[10px] text-slate-500 truncate max-w-xs">{cleanText(tx.notes)}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Quanto (Valor) */}
                    <td className="py-3 px-4 font-mono font-bold text-white text-xs whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* Variação / Tipo matching Change in ref.jpg */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono ${
                        isIncome ? 'text-[#00d284]' : 'text-[#ff4d6a]'
                      }`}>
                        {isIncome ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>{isIncome ? 'Entrada' : 'Saída'}</span>
                      </span>
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <span className="bg-[#161a26] border border-[#222838] px-2 py-0.5 rounded-full text-[10px] text-slate-300">
                        {tx.category}
                      </span>
                    </td>

                    {/* Quando / Data */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-white transition"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir "${cleanText(tx.description, 'Lançamento')}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-[#ff4d6a] transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
