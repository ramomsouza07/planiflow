import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import { cleanText } from '../utils/clientEncryption';
import type { 
  Transaction, 
  TransactionType, 
  PaymentMethod, 
  TransactionStatus 
} from '../types/finance';
import { PAYMENT_METHOD_LABELS } from '../types/finance';
import confetti from 'canvas-confetti';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Search, 
  Receipt,
  Clock, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Tag,
  CreditCard as CardIcon
} from 'lucide-react';

interface OperacoesViewProps {
  editingTransaction?: Transaction | null;
  onClearEditingTransaction?: () => void;
  onGoToSpreadsheet?: () => void;
  onGoToAnalytics?: () => void;
}

const EXPENSE_SUGGESTIONS = [
  'Supermercado',
  'Aluguel',
  'Combustível',
  'Restaurante / Almoço',
  'Farmácia & Remédios',
  'Conta de Energia',
  'Internet / Celular',
  'Academia',
  'Lazer / Cinema',
  'Uber / Transporte'
];

const INCOME_SUGGESTIONS = [
  'Salário Mensal',
  'Adiantamento',
  'Freelance / Projeto',
  'Rendimento / Dividendos',
  'Pix Recebido',
  'Venda de Produto',
  'Reembolso',
  'Comissão'
];

export const OperacoesView: React.FC<OperacoesViewProps> = ({
  editingTransaction,
  onClearEditingTransaction,
  onGoToSpreadsheet,
  onGoToAnalytics,
}) => {
  const { 
    addTransaction, 
    updateTransaction, 
    deleteTransaction, 
    categories, 
    addCategory, 
    transactions, 
    selectedMonth, 
    setSelectedMonth,
    creditCards,
    addInstallmentTransaction
  } = useFinance();

  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  });
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [notes, setNotes] = useState('');
  const [cardId, setCardId] = useState<string>(() => creditCards[0]?.id || '');
  const [installments, setInstallments] = useState<number>(1);
  const [keepFormOpen, setKeepFormOpen] = useState(true);

  // UI state
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showNewCatInline, setShowNewCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0066FF');

  // Auto-sync cardId if not selected
  useEffect(() => {
    if (!cardId && creditCards.length > 0) {
      setCardId(creditCards[0].id);
    }
  }, [creditCards, cardId]);

  // Load editing transaction if provided
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(cleanText(editingTransaction.description));
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod);
      setStatus(editingTransaction.status);
      setNotes(cleanText(editingTransaction.notes || ''));
      setCardId(editingTransaction.cardId || (creditCards[0]?.id || ''));
      setInstallments(editingTransaction.installmentTotal || 1);

      // Scroll smoothly to form
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingTransaction, creditCards]);

  // Sync category when type or categories change
  useEffect(() => {
    const available = categories.filter(c => c.type === type);
    if (available.length > 0 && (!category || !available.some(c => c.name === category))) {
      setCategory(available[0].name);
    }
  }, [type, categories, category]);

  // Month navigation
  const handleMonthChange = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, '0');
    const newStr = `${newYear}-${newMonth}`;
    setSelectedMonth(newStr);
    setDate(`${newStr}-01`);
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amount.replace(',', '.')) || 0;
    setAmount((current + addVal).toFixed(2));
  };

  const handleResetAmount = () => {
    setAmount('');
  };

  const triggerSuccessFeedback = (msg: string) => {
    setSuccessToast(msg);
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0066FF', '#00D284', '#60A5FA']
      });
    } catch {
      // ignore
    }
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        type,
        description: description.trim(),
        amount: parsedAmount,
        date,
        category,
        paymentMethod,
        status,
        notes: notes.trim(),
        cardId: paymentMethod === 'credit' ? (cardId || undefined) : undefined,
      });
      triggerSuccessFeedback(`Operação "${description.trim()}" atualizada com sucesso!`);
      if (onClearEditingTransaction) onClearEditingTransaction();
      setDescription('');
      setAmount('');
      setNotes('');
      setInstallments(1);
    } else {
      if (type === 'expense' && paymentMethod === 'credit' && installments > 1) {
        await addInstallmentTransaction({
          type: 'expense',
          description: description.trim(),
          amount: parsedAmount,
          date,
          category,
          paymentMethod: 'credit',
          status,
          notes: notes.trim(),
        }, installments, cardId || undefined);
        triggerSuccessFeedback(`Compra parcelada em ${installments}x lançada com sucesso!`);
      } else {
        await addTransaction({
          type,
          description: description.trim(),
          amount: parsedAmount,
          date,
          category,
          paymentMethod,
          status,
          notes: notes.trim(),
          cardId: paymentMethod === 'credit' ? (cardId || undefined) : undefined,
          installmentCurrent: paymentMethod === 'credit' && installments === 1 ? 1 : undefined,
          installmentTotal: paymentMethod === 'credit' && installments === 1 ? 1 : undefined,
        });
        triggerSuccessFeedback(`Operação "${description.trim()}" cadastrada com sucesso!`);
      }

      if (keepFormOpen) {
        setDescription('');
        setAmount('');
        setNotes('');
        setInstallments(1);
      }
    }
  };

  const handleCancelEditing = () => {
    if (onClearEditingTransaction) onClearEditingTransaction();
    setDescription('');
    setAmount('');
    setNotes('');
    setType('expense');
    setInstallments(1);
  };

  const handleSaveInlineCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      type,
      color: newCatColor,
      icon: 'Tag',
    });

    setCategory(newCatName.trim());
    setNewCatName('');
    setShowNewCatInline(false);
    triggerSuccessFeedback(`Categoria "${newCatName.trim()}" criada!`);
  };

  const availableCategories = categories.filter(c => c.type === type);

  // Month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Totals for the month
  const monthIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [monthTransactions]);

  const monthExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [monthTransactions]);

  const monthBalance = monthIncome - monthExpense;

  // Filtered transactions for the table below
  const displayedTransactions = useMemo(() => {
    return monthTransactions.filter(tx => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const desc = cleanText(tx.description).toLowerCase();
        const notes = tx.notes ? cleanText(tx.notes).toLowerCase() : '';
        return (
          desc.includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          notes.includes(q)
        );
      }
      return true;
    });
  }, [monthTransactions, typeFilter, searchFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-10">
      
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1b202e]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-blue" />
            Central de Operações
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre e gerencie todas as suas entradas e saídas financeiras em um único lugar
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center bg-[#131622] border border-[#202638] rounded-xl p-1 shadow-inner self-start sm:self-auto">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1d2334] transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-3 text-slate-200 capitalize min-w-[120px] text-center">
            {formatMonthYear(selectedMonth)}
          </span>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1d2334] transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Metrics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de Entradas</span>
            <span className="text-base font-mono font-bold text-[#00d284]">{formatCurrency(monthIncome)}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#00d284]/10 border border-[#00d284]/20 flex items-center justify-center text-[#00d284]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de Saídas</span>
            <span className="text-base font-mono font-bold text-[#ff4d6a]">{formatCurrency(monthExpense)}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#ff4d6a]/10 border border-[#ff4d6a]/20 flex items-center justify-center text-[#ff4d6a]">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Saldo do Mês</span>
            <span className={`text-base font-mono font-bold ${monthBalance >= 0 ? 'text-white' : 'text-[#ff4d6a]'}`}>
              {formatCurrency(monthBalance)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 bg-[#00d284]/15 border border-[#00d284]/30 rounded-2xl text-xs font-semibold text-[#00d284] flex items-center justify-between shadow-lg shadow-[#00d284]/5 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d284] shrink-0" />
            <span>{successToast}</span>
          </div>
          <div className="flex items-center gap-3">
            {onGoToSpreadsheet && (
              <button 
                onClick={onGoToSpreadsheet} 
                className="underline hover:text-white text-[11px] font-bold"
              >
                Abrir Planilha
              </button>
            )}
            {onGoToAnalytics && (
              <button 
                onClick={onGoToAnalytics} 
                className="underline hover:text-white text-[11px] font-bold"
              >
                Abrir Análise
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Centered Operations Form */}
      <div 
        ref={formRef}
        className="bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative"
      >
        
        {/* Editing Banner */}
        {editingTransaction && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2 font-medium">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>Modo de Edição ativado: altere os dados abaixo e clique em Salvar Alterações.</span>
            </div>
            <button
              onClick={handleCancelEditing}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg font-bold text-[11px] transition"
            >
              Cancelar Edição
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Operation Type: Saída vs Entrada */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tipo de Lançamento
            </label>
            <div className="grid grid-cols-2 gap-3 bg-[#141824] p-1.5 rounded-2xl border border-[#202638]">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[#ff4d6a] text-white shadow-lg shadow-[#ff4d6a]/25'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a2030]'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Saída (Despesa / Gasto)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-[#00d284] text-white shadow-lg shadow-[#00d284]/25'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a2030]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Entrada (Receita / Ganho)</span>
              </button>
            </div>
          </div>

          {/* Amount Field with Quick Add Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Quanto (Valor R$) *
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 mr-1 hidden sm:inline">Adicionar:</span>
                {[20, 50, 100, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddAmount(val)}
                    className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-[#151926] hover:bg-[#1f2538] text-slate-300 hover:text-white rounded-lg border border-[#202638] transition active:scale-95 cursor-pointer"
                  >
                    +{val}
                  </button>
                ))}
                {amount && (
                  <button
                    type="button"
                    onClick={handleResetAmount}
                    className="px-2 py-1 text-[10px] text-slate-500 hover:text-[#ff4d6a] transition"
                  >
                    Zerar
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold font-mono text-slate-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-2xl pl-12 pr-4 py-3.5 text-2xl font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue transition shadow-inner"
              />
            </div>
          </div>

          {/* Description & Frequent Suggestions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              O que foi operado (Descrição) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Aluguel, Combustível, Salário quinzenal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#151926] border border-[#202638] rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition"
            />

            <div className="pt-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Sugestões rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(type === 'expense' ? EXPENSE_SUGGESTIONS : INCOME_SUGGESTIONS).map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDescription(item)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-[#141824] hover:bg-[#1c2233] text-slate-400 hover:text-white border border-[#202638] transition cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categoria & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCatInline(!showNewCatInline)}
                  className="text-[10px] text-brand-blue hover:underline font-semibold"
                >
                  {showNewCatInline ? 'Fechar' : '+ Nova Categoria'}
                </button>
              </div>

              {showNewCatInline ? (
                <div className="p-3 bg-[#151926] rounded-2xl border border-[#202638] space-y-2 text-xs mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cadastrar Categoria Rápida</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da categoria..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-[#0b0e17] border border-[#202638] rounded-lg px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-8 h-8 rounded border border-[#202638] bg-transparent cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveInlineCategory}
                    className="w-full py-1.5 bg-brand-blue text-white font-bold rounded-lg hover:bg-brand-blueHover text-xs"
                  >
                    Adicionar Categoria
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue cursor-pointer"
                >
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Data da Operação *
                </label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="text-slate-400 hover:text-white px-1.5 py-0.5 bg-[#141824] rounded border border-[#202638]"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      setDate(y.toISOString().split('T')[0]);
                    }}
                    className="text-slate-400 hover:text-white px-1.5 py-0.5 bg-[#141824] rounded border border-[#202638]"
                  >
                    Ontem
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#151926] border border-[#202638] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue cursor-pointer"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Situação (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full bg-[#151926] border border-[#202638] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue cursor-pointer"
              >
                <option value="completed">Concluído (Pago / Recebido)</option>
                <option value="pending">Pendente (A Pagar / A Receber)</option>
              </select>
            </div>
          </div>

          {/* Credit Card Specific Options: Card selection and Installments */}
          {paymentMethod === 'credit' && (
            <div className="p-4 bg-[#141824] rounded-2xl border border-purple-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <CardIcon className="w-4 h-4" />
                <span>Configurações do Cartão de Crédito</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Select Card */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Cartão Utilizado
                  </label>
                  {creditCards.length > 0 ? (
                    <select
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value)}
                      className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-blue cursor-pointer"
                    >
                      {creditCards.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.lastFourDigits ? `(•• ${c.lastFourDigits})` : ''} - {c.institution}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                      Nenhum cartão cadastrado. Vá em "Cartões & Faturas" para cadastrar.
                    </div>
                  )}
                </div>

                {/* Number of Installments */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Parcelamento
                  </label>
                  <select
                    value={installments}
                    disabled={!!editingTransaction}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-blue cursor-pointer disabled:opacity-50"
                  >
                    <option value={1}>1x - À vista na fatura</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => {
                      const parsed = parseFloat(amount.replace(',', '.'));
                      const partVal = !isNaN(parsed) && parsed > 0 ? (parsed / n) : null;
                      return (
                        <option key={n} value={n}>
                          {n}x {partVal ? `de ${formatCurrency(partVal)}/mês` : 'parcelas'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {installments > 1 && !editingTransaction && (
                <div className="text-[11px] text-slate-400 flex items-center justify-between bg-[#11141e] px-3 py-2 rounded-xl border border-[#1b202e]">
                  <span>Serão lançadas <strong>{installments} parcelas mensais</strong> na fatura a partir de {date}.</span>
                  {amount && !isNaN(parseFloat(amount.replace(',', '.'))) && (
                    <span className="text-purple-300 font-bold font-mono">
                      {installments}x de {formatCurrency(parseFloat(amount.replace(',', '.')) / installments)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Observações & Anotações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Parcela 2/3, nota fiscal anexada, débito programado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#151926] border border-[#202638] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue resize-none"
            />
          </div>

          {/* Actions & Submit */}
          <div className="pt-3 border-t border-[#1b202e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {!editingTransaction ? (
              <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepFormOpen}
                  onChange={(e) => setKeepFormOpen(e.target.checked)}
                  className="w-4 h-4 rounded border-[#202638] bg-[#151926] text-brand-blue focus:ring-0 cursor-pointer"
                />
                <span>Continuar cadastrando após salvar</span>
              </label>
            ) : (
              <button
                type="button"
                onClick={handleCancelEditing}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar Edição
              </button>
            )}

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-blue hover:bg-brand-blueHover text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-brand-blue/30 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{editingTransaction ? 'Salvar Alterações' : 'Cadastrar Operação'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* Centralized Transactions Management Table Below */}
      <div className="bg-[#11141e] border border-[#1d2232] rounded-3xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Table Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-[#1b202e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Lançamentos Registrados</span>
              <span className="text-xs font-mono text-slate-500">({displayedTransactions.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500">Histórico de operações de {formatMonthYear(selectedMonth)}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-[#151926] border border-[#202638] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue w-40 sm:w-48"
              />
            </div>

            {/* Type Filters */}
            <div className="flex bg-[#131622] border border-[#202638] rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  typeFilter === 'all' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1 rounded-lg transition ${
                  typeFilter === 'income' ? 'bg-[#00d284] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Entradas
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1 rounded-lg transition ${
                  typeFilter === 'expense' ? 'bg-[#ff4d6a] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Saídas
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-[#1b202e] select-none">
                <th className="py-3 px-4">Operação</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Forma & Data</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181c28]">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    Nenhuma operação encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="hover:bg-[#141824] transition group">
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome ? 'bg-[#00d284]/15 text-[#00d284]' : 'bg-[#ff4d6a]/15 text-[#ff4d6a]'
                          }`}>
                            {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{cleanText(tx.description, 'Lançamento')}</span>
                            {tx.notes && <span className="text-[10px] text-slate-500 block truncate max-w-xs">{cleanText(tx.notes)}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#151926] text-slate-300 border border-[#202638]">
                          <Tag className="w-3 h-3 text-brand-blue" />
                          <span>{tx.category}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        <div>{PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}</div>
                        <div className="text-[10px] text-slate-500">{tx.date}</div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            updateTransaction(tx.id, {
                              status: tx.status === 'completed' ? 'pending' : 'completed'
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            tx.status === 'completed'
                              ? 'bg-[#00d284]/15 text-[#00d284] border border-[#00d284]/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                          title="Clique para alternar status"
                        >
                          {tx.status === 'completed' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{tx.status === 'completed' ? 'Concluído' : 'Pendente'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        <span className={isIncome ? 'text-[#00d284]' : 'text-[#ff4d6a]'}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setType(tx.type);
                              setDescription(cleanText(tx.description));
                              setAmount(tx.amount.toString());
                              setDate(tx.date);
                              setCategory(tx.category);
                              setPaymentMethod(tx.paymentMethod);
                              setStatus(tx.status);
                              setNotes(cleanText(tx.notes || ''));
                              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#151926] transition"
                            title="Editar operação"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir permanentemente "${cleanText(tx.description, 'Lançamento')}"?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#ff4d6a] rounded-lg hover:bg-[#151926] transition"
                            title="Excluir operação"
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

    </div>
  );
};
