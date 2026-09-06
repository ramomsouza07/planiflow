import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction, TransactionType, PaymentMethod, TransactionStatus } from '../types/finance';
import { PAYMENT_METHOD_LABELS } from '../types/finance';
import { formatCurrency, formatDate, getRelativeTime } from '../utils/formatters';
import { cleanText } from '../utils/clientEncryption';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Plus, 
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpreadsheetTableProps {
  onEditTransaction: (tx: Transaction) => void;
}

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({ onEditTransaction }) => {
  const { 
    filteredTransactions, 
    deleteTransaction, 
    updateTransaction, 
    addTransaction, 
    categories,
    filters,
    setFilters,
  } = useFinance();

  // Quick inline add state
  const [quickType, setQuickType] = useState<TransactionType>('expense');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quickCategory, setQuickCategory] = useState('');
  const [quickPayment, setQuickPayment] = useState<PaymentMethod>('pix');
  const [quickStatus, setQuickStatus] = useState<TransactionStatus>('completed');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(true);

  // Filter available categories based on selected quick type
  const availableQuickCategories = categories.filter(c => c.type === quickType);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDesc.trim() || !quickAmount) return;

    const amountNum = parseFloat(quickAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) return;

    const defaultCat = availableQuickCategories[0]?.name || (quickType === 'income' ? 'Salário' : 'Outras Saídas');

    addTransaction({
      type: quickType,
      description: quickDesc.trim(),
      amount: amountNum,
      date: quickDate,
      category: quickCategory || defaultCat,
      paymentMethod: quickPayment,
      status: quickStatus,
    });

    if (quickType === 'income' && amountNum >= 1000) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }
    }

    // Reset inputs
    setQuickDesc('');
    setQuickAmount('');
  };

  const handleToggleStatus = (tx: Transaction) => {
    const nextStatus: TransactionStatus = tx.status === 'completed' ? 'pending' : 'completed';
    updateTransaction(tx.id, { status: nextStatus });
  };

  // Calculate totals of visible rows
  const visibleIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const visibleExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const visibleBalance = visibleIncome - visibleExpense;

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      
      {/* Table Header & Controls Bar */}
      <div className="p-4 lg:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Planilha de Lançamentos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize, filtre e adicione entradas e saídas rapidamente
          </p>
        </div>

        {/* Search & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar descrição ou valor..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {filters.searchQuery && (
              <button 
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={filters.type || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
            className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Apenas Entradas (+)</option>
            <option value="expense">Apenas Saídas (-)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os status</option>
            <option value="completed">Concluídos</option>
            <option value="pending">Pendentes</option>
          </select>

          {/* Toggle Quick Add Row */}
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isQuickAddOpen 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Plus className={`w-3.5 h-3.5 transition-transform ${isQuickAddOpen ? 'rotate-45' : ''}`} />
            <span>Linha Rápida</span>
          </button>

        </div>

      </div>

      {/* Quick Add Row (Excel / Sheets style fast input) */}
      {isQuickAddOpen && (
        <form 
          onSubmit={handleQuickAdd}
          className="bg-slate-950/90 border-b border-slate-800 p-3 lg:px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-2.5 items-center transition-all animate-fade-in"
        >
          {/* 1. Tipo */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-700 p-0.5 bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setQuickType('expense');
                  setQuickCategory('');
                }}
                className={`flex-1 py-1 text-[11px] font-semibold rounded transition ${
                  quickType === 'expense' 
                    ? 'bg-rose-500 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Saída
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickType('income');
                  setQuickCategory('');
                }}
                className={`flex-1 py-1 text-[11px] font-semibold rounded transition ${
                  quickType === 'income' 
                    ? 'bg-emerald-500 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entrada
              </button>
            </div>
          </div>

          {/* 2. O que (Descrição) */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">O que foi operado</label>
            <input
              type="text"
              required
              placeholder="Ex: Mercado, Salário, Uber..."
              value={quickDesc}
              onChange={(e) => setQuickDesc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 3. Categoria */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Categoria</label>
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {availableQuickCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* 4. Quanto (Valor) */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 5. Quando (Data) */}
          <div className="lg:col-span-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Quando</label>
            <input
              type="date"
              required
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="lg:col-span-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Forma</label>
            <select
              value={quickPayment}
              onChange={(e) => setQuickPayment(e.target.value as PaymentMethod)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key]) => (
                <option key={key} value={key}>{key.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="lg:col-span-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
            <select
              value={quickStatus}
              onChange={(e) => setQuickStatus(e.target.value as TransactionStatus)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="completed">Pago</option>
              <option value="pending">Pendente</option>
            </select>
          </div>

          {/* 6. Botão Adicionar */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full mt-auto py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center gap-1"
              title="Salvar linha na planilha"
            >
              <Check className="w-3.5 h-3.5" />
              <span className="lg:hidden">Adicionar</span>
            </button>
          </div>
        </form>
      )}

      {/* Spreadsheet Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800 select-none">
              <th className="py-3 px-4 w-28">Tipo</th>
              <th className="py-3 px-4 w-32">Quando</th>
              <th className="py-3 px-4 min-w-[200px]">O que (Descrição)</th>
              <th className="py-3 px-4 min-w-[150px]">Categoria</th>
              <th className="py-3 px-4 w-32">Pagamento</th>
              <th className="py-3 px-4 w-28">Status</th>
              <th className="py-3 px-4 w-36 text-right">Quanto (Valor)</th>
              <th className="py-3 px-4 w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-medium">Nenhum registro encontrado para este filtro.</p>
                  <p className="text-xs text-slate-600 mt-1">Utilize a linha rápida acima para registrar sua primeira movimentação.</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-slate-800/40 transition-colors group spreadsheet-cell"
                  >
                    {/* Tipo */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                        isIncome 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {isIncome ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{isIncome ? 'Entrada' : 'Saída'}</span>
                      </span>
                    </td>

                    {/* Quando / Data */}
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <div className="font-mono text-xs">{formatDate(tx.date)}</div>
                      <div className="text-[10px] text-slate-500">{getRelativeTime(tx.date)}</div>
                    </td>

                    {/* O que / Descrição */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{cleanText(tx.description, 'Lançamento')}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 italic truncate max-w-xs">
                          {cleanText(tx.notes)}
                        </div>
                      )}
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80">
                        {tx.category}
                      </span>
                    </td>

                    {/* Forma de Pagamento */}
                    <td className="py-3 px-4 text-slate-300 uppercase text-[11px] font-medium tracking-wide">
                      {tx.paymentMethod}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(tx)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          tx.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                        title="Clique para alternar o status"
                      >
                        {tx.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>Concluído</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Pendente</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Quanto / Valor */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`font-mono text-xs font-bold ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded transition"
                          title="Editar lançamento"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir "${cleanText(tx.description, 'Lançamento')}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          title="Excluir lançamento"
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

          {/* Spreadsheet Total Summary Footer */}
          {filteredTransactions.length > 0 && (
            <tfoot>
              <tr className="bg-slate-950 text-slate-200 border-t-2 border-slate-700 font-semibold">
                <td colSpan={3} className="py-3 px-4 text-xs">
                  <span className="text-slate-400">Total visível ({filteredTransactions.length} linhas):</span>
                </td>
                <td colSpan={3} className="py-3 px-4 text-xs text-slate-400">
                  <span className="text-emerald-400 font-mono font-bold mr-4">
                    + {formatCurrency(visibleIncome)}
                  </span>
                  <span className="text-rose-400 font-mono font-bold">
                    - {formatCurrency(visibleExpense)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-sm whitespace-nowrap">
                  <span className={visibleBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    = {formatCurrency(visibleBalance)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

    </div>
  );
};
