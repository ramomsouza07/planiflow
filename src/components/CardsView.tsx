import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import type { CreditCard } from '../types/finance';
import { 
  CreditCard as CardIcon, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Zap,
  Clock
} from 'lucide-react';

interface CardsViewProps {
  onGoToOperacoes?: () => void;
}

export const CardsView: React.FC<CardsViewProps> = ({ onGoToOperacoes }) => {
  const { 
    creditCards, 
    addCreditCard, 
    updateCreditCard, 
    deleteCreditCard, 
    transactions, 
    selectedMonth, 
    setSelectedMonth,
    addInstallmentTransaction,
    categories
  } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string>(() => creditCards[0]?.id || '');
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // New Card Form State
  const [cardName, setCardName] = useState('');
  const [cardInstitution, setCardInstitution] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('5');
  const [cardDueDay, setCardDueDay] = useState('12');
  const [cardDigits, setCardDigits] = useState('');
  const [cardColor, setCardColor] = useState('#820AD1');
  const [cardBrand, setCardBrand] = useState<'mastercard' | 'visa' | 'elo' | 'amex' | 'other'>('mastercard');

  // New Expense Form State
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState('Compras Pessoais');
  const [expInstallments, setExpInstallments] = useState(1);
  const [expCardId, setExpCardId] = useState(() => selectedCardId || creditCards[0]?.id || '');

  // Active selected card
  const activeCard = useMemo(() => {
    return creditCards.find(c => c.id === selectedCardId) || creditCards[0];
  }, [creditCards, selectedCardId]);

  // Transactions related to active card
  const cardTransactions = useMemo(() => {
    if (!activeCard) return [];
    return transactions.filter(t => 
      t.paymentMethod === 'credit' && 
      (t.cardId === activeCard.id || (!t.cardId && creditCards.length === 1))
    );
  }, [transactions, activeCard, creditCards]);

  // Current month invoice transactions
  const currentMonthTransactions = useMemo(() => {
    return cardTransactions.filter(t => t.date.startsWith(selectedMonth));
  }, [cardTransactions, selectedMonth]);

  // Current invoice total
  const currentInvoiceTotal = useMemo(() => {
    return currentMonthTransactions.reduce((acc, t) => acc + (t.type === 'expense' ? t.amount : -t.amount), 0);
  }, [currentMonthTransactions]);

  // Total credit limit across all cards
  const totalLimitAll = useMemo(() => {
    return creditCards.reduce((acc, c) => acc + c.limit, 0);
  }, [creditCards]);

  // Total spent across all cards in current month
  const totalSpentAllCurrentMonth = useMemo(() => {
    return transactions
      .filter(t => t.paymentMethod === 'credit' && t.date.startsWith(selectedMonth) && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, selectedMonth]);

  // Future invoices projection (next 6 months)
  const futureInvoices = useMemo(() => {
    if (!activeCard) return [];
    const projections: { monthStr: string; label: string; amount: number }[] = [];
    const [currYear, currMonth] = selectedMonth.split('-').map(Number);

    for (let offset = 0; offset <= 5; offset++) {
      const d = new Date(currYear, currMonth - 1 + offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const monthStr = `${y}-${m}`;

      const total = cardTransactions
        .filter(t => t.date.startsWith(monthStr) && t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      projections.push({
        monthStr,
        label: formatMonthYear(monthStr),
        amount: total,
      });
    }

    return projections;
  }, [cardTransactions, selectedMonth, activeCard]);

  // Available limit for active card
  const availableLimit = activeCard ? Math.max(0, activeCard.limit - currentInvoiceTotal) : 0;
  const limitUsedPercent = activeCard && activeCard.limit > 0 
    ? Math.min(100, (currentInvoiceTotal / activeCard.limit) * 100) 
    : 0;

  // Handlers
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim() || !cardLimit) return;

    const limitNum = parseFloat(cardLimit.replace(',', '.')) || 1000;
    const closing = parseInt(cardClosingDay, 10) || 5;
    const due = parseInt(cardDueDay, 10) || 12;

    if (editingCard) {
      updateCreditCard(editingCard.id, {
        name: cardName.trim(),
        institution: cardInstitution.trim() || 'Banco',
        limit: limitNum,
        closingDay: closing,
        dueDay: due,
        lastFourDigits: cardDigits.trim(),
        color: cardColor,
        brand: cardBrand,
      });
      setEditingCard(null);
    } else {
      addCreditCard({
        name: cardName.trim(),
        institution: cardInstitution.trim() || 'Banco',
        limit: limitNum,
        closingDay: closing,
        dueDay: due,
        lastFourDigits: cardDigits.trim(),
        color: cardColor,
        brand: cardBrand,
      });
    }

    setShowAddCardModal(false);
    resetCardForm();
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount) return;

    const amountNum = parseFloat(expAmount.replace(',', '.')) || 0;
    if (amountNum <= 0) return;

    await addInstallmentTransaction(
      {
        type: 'expense',
        description: expDesc.trim(),
        amount: amountNum,
        date: expDate,
        category: expCategory || 'Compras Pessoais',
        paymentMethod: 'credit',
        status: 'completed',
        cardId: expCardId,
      },
      expInstallments,
      expCardId
    );

    setShowAddExpenseModal(false);
    setExpDesc('');
    setExpAmount('');
    setExpInstallments(1);
  };

  const resetCardForm = () => {
    setCardName('');
    setCardInstitution('');
    setCardLimit('');
    setCardClosingDay('5');
    setCardDueDay('12');
    setCardDigits('');
    setCardColor('#820AD1');
    setCardBrand('mastercard');
  };

  const openEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardInstitution(card.institution);
    setCardLimit(card.limit.toString());
    setCardClosingDay(card.closingDay.toString());
    setCardDueDay(card.dueDay.toString());
    setCardDigits(card.lastFourDigits || '');
    setCardColor(card.color || '#820AD1');
    setCardBrand(card.brand || 'mastercard');
    setShowAddCardModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CardIcon className="w-5 h-5 text-brand-blue" />
            Cartões de Crédito & Faturas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie limites, parcelamentos inteligentes e acompanhe suas faturas mês a mês
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setExpCardId(activeCard?.id || creditCards[0]?.id || '');
              setShowAddExpenseModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Compra Parcelada</span>
          </button>

          <button
            onClick={() => {
              resetCardForm();
              setEditingCard(null);
              setShowAddCardModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#151926] hover:bg-[#1f2538] text-slate-300 hover:text-white border border-[#202638] text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <CardIcon className="w-4 h-4 text-brand-blue" />
            <span>Adicionar Cartão</span>
          </button>

          {onGoToOperacoes && (
            <button
              onClick={onGoToOperacoes}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#151926] hover:bg-[#1f2538] text-slate-400 hover:text-white border border-[#202638] text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <span>Lançar em Operações</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Faturas ({formatMonthYear(selectedMonth)})</span>
          <span className="text-xl font-mono font-bold text-rose-400 mt-1 block">
            {formatCurrency(totalSpentAllCurrentMonth)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Comprometido no cartão neste mês</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Limite Total Combinado</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">
            {formatCurrency(totalLimitAll)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">{creditCards.length} cartões cadastrados</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Limite Global Disponível</span>
          <span className="text-xl font-mono font-bold text-[#00D284] mt-1 block">
            {formatCurrency(Math.max(0, totalLimitAll - totalSpentAllCurrentMonth))}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Margem de crédito livre</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Taxa de Uso de Limite</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-mono font-bold text-white">
              {totalLimitAll > 0 ? ((totalSpentAllCurrentMonth / totalLimitAll) * 100).toFixed(1) : 0}%
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              totalSpentAllCurrentMonth / totalLimitAll <= 0.3 ? 'bg-[#00D284]/15 text-[#00D284]' : 'bg-[#FFA800]/15 text-[#FFA800]'
            }`}>
              {totalSpentAllCurrentMonth / totalLimitAll <= 0.3 ? 'Saudável' : 'Atenção'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Ideal: manter abaixo de 30%</span>
        </div>
      </div>

      {/* Main Grid: Card Selector & Visual Card + Invoice details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Interactive Credit Card Preview & Card List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Visual Credit Card Display */}
          {activeCard ? (
            <div 
              className="relative w-full h-56 rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-white overflow-hidden transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${activeCard.color} 0%, #0d111a 130%)`,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: `0 20px 40px -15px ${activeCard.color}40`,
              }}
            >
              {/* Subtle background circuit pattern / shimmer */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              
              {/* Top Card Row */}
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold block">
                    {activeCard.institution || 'Cartão'}
                  </span>
                  <span className="text-base font-black tracking-tight drop-shadow-md">
                    {activeCard.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-black/30 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                    {activeCard.brand || 'mastercard'}
                  </span>
                </div>
              </div>

              {/* Middle: Golden Chip & Contactless icon */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-300 to-amber-500 border border-amber-200/50 shadow-inner flex items-center justify-center">
                  <div className="w-7 h-5 border border-amber-900/30 rounded" />
                </div>
                <Zap className="w-4 h-4 text-white/60" />
              </div>

              {/* Bottom Card Row */}
              <div className="relative z-10 space-y-2">
                <div className="font-mono text-sm tracking-[0.25em] text-white/90 drop-shadow">
                  •••• •••• •••• {activeCard.lastFourDigits || '••••'}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/15">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block">Fecha dia</span>
                    <span className="font-bold">{activeCard.closingDay}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block">Vence dia</span>
                    <span className="font-bold">{activeCard.dueDay}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block">Limite Total</span>
                    <span className="font-mono font-bold">{formatCurrency(activeCard.limit)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-56 bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3">
              <CardIcon className="w-12 h-12 text-slate-600" />
              <p className="text-xs text-slate-400">Nenhum cartão cadastrado ainda.</p>
              <button
                onClick={() => setShowAddCardModal(true)}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold"
              >
                Cadastrar Primeiro Cartão
              </button>
            </div>
          )}

          {/* Active Card Quick Actions & Limit Bar */}
          {activeCard && (
            <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Status do Limite</span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {limitUsedPercent.toFixed(1)}% utilizado
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full bg-[#151926] rounded-full overflow-hidden p-0.5 border border-[#202638]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    limitUsedPercent > 80 ? 'bg-rose-500' : limitUsedPercent > 50 ? 'bg-amber-400' : 'bg-[#00D284]'
                  }`}
                  style={{ width: `${limitUsedPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Fatura Atual</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">{formatCurrency(currentInvoiceTotal)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Limite Livre</span>
                  <span className="font-mono font-bold text-[#00D284] text-sm">{formatCurrency(availableLimit)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#1b202e]">
                <button
                  onClick={() => openEditCard(activeCard)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#151926] hover:bg-[#1d2436] text-slate-300 rounded-xl text-xs font-semibold border border-[#202638] transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Cartão</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja excluir o cartão "${activeCard.name}"?`)) {
                      deleteCreditCard(activeCard.id);
                    }
                  }}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/20 transition"
                  title="Excluir Cartão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Cards Switcher Tabs */}
          {creditCards.length > 1 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block px-1">Seus Cartões</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {creditCards.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCardId(c.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      c.id === activeCard?.id
                        ? 'bg-[#151926] border-brand-blue shadow-md shadow-brand-blue/10'
                        : 'bg-[#11141e] border-[#1d2232] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-500">Lim: {formatCurrency(c.limit)}</div>
                      </div>
                    </div>
                    {c.id === activeCard?.id && <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (7 Cols): Current Invoice Breakdown & Future Projections */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Projeção de Faturas Futuras (Próximos 6 meses) */}
          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b202e]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  Comprometimento Futuro (Próximas Faturas)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Veja quanto do seu orçamento já está pré-comprometido com parcelamentos
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-semibold bg-[#151926] px-2.5 py-1 rounded-lg border border-[#202638]">
                6 Meses
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {futureInvoices.map((inv, idx) => {
                const isSelected = inv.monthStr === selectedMonth;
                return (
                  <div
                    key={inv.monthStr}
                    onClick={() => setSelectedMonth(inv.monthStr)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                      isSelected 
                        ? 'bg-brand-blue/15 border-brand-blue shadow-md shadow-brand-blue/20' 
                        : 'bg-[#151926] border-[#202638] hover:border-slate-600'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-medium block truncate capitalize">
                      {inv.label.split(' ')[0]}
                    </span>
                    <span className={`text-xs font-mono font-bold mt-1 block ${
                      inv.amount > 0 ? (isSelected ? 'text-white' : 'text-rose-400') : 'text-slate-500'
                    }`}>
                      {formatCurrency(inv.amount)}
                    </span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold text-brand-blue block mt-1">Atual</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lançamentos do Cartão no Mês Selecionado */}
          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b202e]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Compras na Fatura de {formatMonthYear(selectedMonth)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentMonthTransactions.length} operações registradas no cartão
                </p>
              </div>

              <span className="text-sm font-mono font-bold text-rose-400">
                {formatCurrency(currentInvoiceTotal)}
              </span>
            </div>

            {currentMonthTransactions.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs space-y-2">
                <CardIcon className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p>Nenhuma compra no cartão registrada para {formatMonthYear(selectedMonth)}.</p>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="text-brand-blue hover:underline font-semibold"
                >
                  + Lançar nova compra no cartão
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#1b202e] max-h-96 overflow-y-auto pr-1">
                {currentMonthTransactions.map(tx => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#151926]/50 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">
                        {tx.installmentTotal && tx.installmentTotal > 1 ? (
                          <span className="text-[10px]">{tx.installmentCurrent}/{tx.installmentTotal}</span>
                        ) : (
                          <CardIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-white block truncate">{tx.description}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="text-slate-400">{tx.category}</span>
                          {tx.installmentTotal && tx.installmentTotal > 1 && (
                            <span className="text-brand-blue font-bold">
                              (Parcela {tx.installmentCurrent} de {tx.installmentTotal})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-rose-400 block">
                        {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[10px] text-slate-500">Fatura</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Modal: Adicionar/Editar Cartão */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="text-base font-bold text-white">
              {editingCard ? 'Editar Cartão de Crédito' : 'Cadastrar Novo Cartão'}
            </h3>

            <form onSubmit={handleSaveCard} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Cartão *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Ultravioleta, XP Infinite"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Instituição / Banco</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú"
                    value={cardInstitution}
                    onChange={(e) => setCardInstitution(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ex: 8492"
                    value={cardDigits}
                    onChange={(e) => setCardDigits(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Limite Total do Cartão (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 10000.00"
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Dia Fechamento (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardClosingDay}
                    onChange={(e) => setCardClosingDay(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Dia Vencimento (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Bandeira</label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value as any)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                    <option value="amex">American Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cor do Cartão</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardColor}
                      onChange={(e) => setCardColor(e.target.value)}
                      className="w-10 h-8 rounded border border-[#202638] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-400">{cardColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 bg-[#151926] hover:bg-[#1d2436] text-slate-400 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition"
                >
                  {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Compra Parcelada */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CardIcon className="w-5 h-5 text-brand-blue" />
                Nova Compra no Cartão
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolha o número de parcelas para gerar automaticamente as faturas futuras
              </p>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cartão de Crédito</label>
                <select
                  value={expCardId}
                  onChange={(e) => setExpCardId(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                >
                  {creditCards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Lim. livre: {formatCurrency(c.limit)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição da Compra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Celular novo, Supermercado, Passagem"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 1200.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Número de Parcelas</label>
                  <select
                    value={expInstallments}
                    onChange={(e) => setExpInstallments(parseInt(e.target.value, 10))}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value={1}>1x (À vista na fatura)</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                      <option key={n} value={n}>{n}x parcelas</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Installment Simulation Feedback */}
              {expInstallments > 1 && parseFloat(expAmount) > 0 && (
                <div className="p-3 bg-brand-blue/10 border border-brand-blue/30 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>{expInstallments} parcelas de:</span>
                    <span className="font-mono text-brand-blue">
                      {formatCurrency(parseFloat(expAmount) / expInstallments)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    O sistema criará automaticamente 1 parcela por mês nas faturas seguintes.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Data da 1ª Parcela</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Categoria</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 bg-[#151926] hover:bg-[#1d2436] text-slate-400 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition"
                >
                  Lançar na Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
