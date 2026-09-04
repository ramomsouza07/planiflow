import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import type { RecurringBill, PaymentMethod } from '../types/finance';
import { 
  CalendarClock, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Repeat, 
  Calendar
} from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const { 
    recurringBills, 
    addRecurringBill, 
    updateRecurringBill, 
    deleteRecurringBill, 
    markBillAsPaid, 
    creditCards, 
    categories, 
    selectedMonth 
  } = useFinance();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [category, setCategory] = useState('Assinaturas & Serviços');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [cardId, setCardId] = useState('');
  const [notes, setNotes] = useState('');

  const today = new Date();
  const currentDay = today.getDate();

  // Metrics
  const totalMonthlyCost = useMemo(() => {
    return recurringBills.reduce((acc, b) => {
      const monthlyAmount = b.frequency === 'yearly' ? b.amount / 12 : b.amount;
      return acc + monthlyAmount;
    }, 0);
  }, [recurringBills]);

  const totalYearlyCost = totalMonthlyCost * 12;

  // Paid vs Pending in selected month
  const billsWithStatus = useMemo(() => {
    return recurringBills.map(bill => {
      const isPaid = bill.lastPaidDate && bill.lastPaidDate.startsWith(selectedMonth);
      const isPastDue = !isPaid && currentDay > bill.dueDay && selectedMonth === today.toISOString().substring(0, 7);
      const isDueSoon = !isPaid && bill.dueDay - currentDay >= 0 && bill.dueDay - currentDay <= 3 && selectedMonth === today.toISOString().substring(0, 7);
      const isDueToday = !isPaid && bill.dueDay === currentDay && selectedMonth === today.toISOString().substring(0, 7);

      return {
        ...bill,
        isPaid,
        isPastDue,
        isDueSoon,
        isDueToday,
      };
    });
  }, [recurringBills, selectedMonth, currentDay, today]);

  const paidCount = billsWithStatus.filter(b => b.isPaid).length;
  const pendingCount = billsWithStatus.length - paidCount;

  // Filtered List
  const filteredBills = useMemo(() => {
    return billsWithStatus.filter(b => {
      if (filterStatus === 'paid') return b.isPaid;
      if (filterStatus === 'pending') return !b.isPaid;
      return true;
    }).sort((a, b) => a.dueDay - b.dueDay);
  }, [billsWithStatus, filterStatus]);

  // Handlers
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    const amountNum = parseFloat(amount.replace(',', '.')) || 0;
    const dueDayNum = Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1));

    if (editingBillId) {
      updateRecurringBill(editingBillId, {
        name: name.trim(),
        amount: amountNum,
        dueDay: dueDayNum,
        category,
        frequency,
        paymentMethod,
        cardId: cardId || undefined,
        notes: notes.trim() || undefined,
      });
      setEditingBillId(null);
    } else {
      addRecurringBill({
        name: name.trim(),
        amount: amountNum,
        dueDay: dueDayNum,
        category,
        frequency,
        paymentMethod,
        cardId: cardId || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setDueDay('10');
    setCategory('Assinaturas & Serviços');
    setFrequency('monthly');
    setPaymentMethod('credit');
    setCardId(creditCards[0]?.id || '');
    setNotes('');
    setEditingBillId(null);
  };

  const openEdit = (bill: RecurringBill) => {
    setEditingBillId(bill.id);
    setName(bill.name);
    setAmount(bill.amount.toString());
    setDueDay(bill.dueDay.toString());
    setCategory(bill.category);
    setFrequency(bill.frequency);
    setPaymentMethod(bill.paymentMethod);
    setCardId(bill.cardId || '');
    setNotes(bill.notes || '');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-brand-blue" />
            Contas Fixas & Assinaturas Recorrentes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle vencimentos, preveja o impacto anual e confirme pagamentos com 1 clique
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Assinatura / Conta</span>
        </button>
      </div>

      {/* Global Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Mensal Comprometido</span>
          <span className="text-xl font-mono font-bold text-rose-400 mt-1 block">
            {formatCurrency(totalMonthlyCost)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Soma de todas as contas fixas do mês</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Raio-X Anual Projetado</span>
          <span className="text-xl font-mono font-bold text-amber-400 mt-1 block">
            {formatCurrency(totalYearlyCost)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Impacto anual em suas finanças</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Status de {formatMonthYear(selectedMonth)}</span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-bold text-[#00D284] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {paidCount} Pagas
            </span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {pendingCount} Pendentes
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">{recurringBills.length} serviços cadastrados</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Dica de Otimização</span>
          <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
            Revise serviços pouco usados a cada 3 meses para recuperar folga no orçamento.
          </p>
          <span className="text-[10px] text-brand-blue mt-1 block font-semibold">Economia garantida</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 bg-[#11141e] p-2 rounded-2xl border border-[#1d2232]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'all'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({recurringBills.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'paid'
                ? 'bg-[#00D284] text-white shadow-md shadow-[#00D284]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pagas ({paidCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:block">
          Mês de referência: <strong className="text-white capitalize">{formatMonthYear(selectedMonth)}</strong>
        </span>
      </div>

      {/* Subscriptions List */}
      {filteredBills.length === 0 ? (
        <div className="bg-[#11141e] border border-[#1d2232] rounded-3xl p-12 text-center space-y-3">
          <Repeat className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">Nenhuma conta fixa ou assinatura encontrada neste filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => {
            const card = creditCards.find(c => c.id === bill.cardId);

            return (
              <div
                key={bill.id}
                className={`bg-[#11141e] border rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between transition group ${
                  bill.isPaid 
                    ? 'border-[#1d2232] opacity-80 hover:opacity-100' 
                    : bill.isDueToday
                    ? 'border-amber-400/60 bg-amber-500/5'
                    : bill.isPastDue
                    ? 'border-rose-500/60 bg-rose-500/5'
                    : 'border-[#1d2232] hover:border-slate-700'
                }`}
              >
                
                {/* Top Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {bill.category}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                        {bill.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => openEdit(bill)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#151926]"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Deseja remover "${bill.name}" das contas fixas?`)) {
                            deleteRecurringBill(bill.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-[#151926]"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Due Day and Payment Method */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                      Vence dia {bill.dueDay}
                    </span>
                    <span>•</span>
                    <span className="capitalize">
                      {bill.paymentMethod === 'credit' && card ? `Cartão (${card.name})` : bill.paymentMethod.toUpperCase()}
                    </span>
                  </div>

                  {bill.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      "{bill.notes}"
                    </p>
                  )}
                </div>

                {/* Amount & Status Badge */}
                <div className="p-3 bg-[#151926] rounded-xl border border-[#202638] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      {bill.frequency === 'yearly' ? 'Valor Anual' : 'Valor Mensal'}
                    </span>
                    <span className="text-base font-mono font-bold text-white">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>

                  {bill.isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#00D284]/15 text-[#00D284] border border-[#00D284]/30">
                      <CheckCircle2 className="w-3 h-3" /> Paga
                    </span>
                  ) : bill.isDueToday ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                      <AlertCircle className="w-3 h-3" /> Vence Hoje!
                    </span>
                  ) : bill.isPastDue ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      <AlertCircle className="w-3 h-3" /> Em atraso
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      <Clock className="w-3 h-3" /> Pendente
                    </span>
                  )}
                </div>

                {/* Mark as Paid Action */}
                {!bill.isPaid ? (
                  <button
                    onClick={() => markBillAsPaid(bill.id)}
                    className="w-full py-2 bg-brand-blue hover:bg-brand-blueHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-blue/20 transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar como Paga (Lançar)</span>
                  </button>
                ) : (
                  <div className="text-center py-1 text-[11px] text-[#00D284] font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmada no fluxo de {formatMonthYear(selectedMonth)}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar/Editar Conta Fixa */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="text-base font-bold text-white">
              {editingBillId ? 'Editar Conta / Assinatura' : 'Cadastrar Conta Fixa ou Assinatura'}
            </h3>

            <form onSubmit={handleSaveBill} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Serviço / Conta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Netflix, Spotify, Aluguel, Academia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 55.90"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Dia do Vencimento (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="Ex: 10"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Periodicidade</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Meio de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="credit">Cartão de Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="debit">Débito em Conta</option>
                    <option value="transfer">Boleto / TED</option>
                  </select>
                </div>

                {paymentMethod === 'credit' && creditCards.length > 0 && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Cartão Vinculado</label>
                    <select
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value)}
                      className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                    >
                      <option value="">Nenhum específico</option>
                      {creditCards.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Anotações (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Plano família, débito automático..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#151926] hover:bg-[#1d2436] text-slate-400 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition"
                >
                  {editingBillId ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
