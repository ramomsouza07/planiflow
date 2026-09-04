import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import type { FinancialGoal } from '../types/finance';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plane, 
  Home, 
  Car, 
  GraduationCap, 
  ShieldCheck, 
  Compass
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  Viagem: Plane,
  Imóvel: Home,
  Veículo: Car,
  Educação: GraduationCap,
  Investimentos: TrendingUp,
  Reserva: ShieldCheck,
  Outros: Compass,
};

export const GoalsView: React.FC = () => {
  const { 
    goals, 
    addGoal, 
    updateGoal, 
    deleteGoal, 
    contributeToGoal
  } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [isWithdrawal, setIsWithdrawal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Viagem');
  const [color, setColor] = useState('#0066FF');
  const [notes, setNotes] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Global Metrics
  const totalTarget = useMemo(() => goals.reduce((acc, g) => acc + g.targetAmount, 0), [goals]);
  const totalCurrent = useMemo(() => goals.reduce((acc, g) => acc + g.currentAmount, 0), [goals]);
  const totalRemaining = Math.max(0, totalTarget - totalCurrent);
  const overallProgress = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0;

  // Handlers
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount) return;

    const targetNum = parseFloat(targetAmount.replace(',', '.')) || 0;
    const currentNum = parseFloat(currentAmount.replace(',', '.')) || 0;

    if (editingGoalId) {
      updateGoal(editingGoalId, {
        title: title.trim(),
        targetAmount: targetNum,
        currentAmount: currentNum,
        deadline: deadline || undefined,
        category,
        color,
        notes: notes.trim() || undefined,
      });
      setEditingGoalId(null);
    } else {
      addGoal({
        title: title.trim(),
        targetAmount: targetNum,
        currentAmount: currentNum,
        deadline: deadline || undefined,
        category,
        color,
        notes: notes.trim() || undefined,
      });
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributeAmount) return;

    const amountNum = parseFloat(contributeAmount.replace(',', '.')) || 0;
    if (amountNum <= 0) return;

    await contributeToGoal(selectedGoal.id, amountNum, isWithdrawal);
    setShowContributeModal(false);
    setContributeAmount('');
    setSelectedGoal(null);
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setCategory('Viagem');
    setColor('#0066FF');
    setNotes('');
    setEditingGoalId(null);
  };

  const openEdit = (goal: FinancialGoal) => {
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline || '');
    setCategory(goal.category || 'Viagem');
    setColor(goal.color || '#0066FF');
    setNotes(goal.notes || '');
    setShowAddModal(true);
  };

  const openContribute = (goal: FinancialGoal, withdraw: boolean) => {
    setSelectedGoal(goal);
    setIsWithdrawal(withdraw);
    setContributeAmount('');
    setShowContributeModal(true);
  };

  // Helper calculation for months remaining
  const getMonthsLeft = (deadlineDate?: string) => {
    if (!deadlineDate) return null;
    const now = new Date();
    const end = new Date(deadlineDate);
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(1, months);
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-5 h-5 text-brand-blue" />
            Metas Financeiras & Sonhos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Planeje suas conquistas, simule aportes mensais e acompanhe seu progresso até o objetivo
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
          <span>Criar Nova Meta</span>
        </button>
      </div>

      {/* Global Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Acumulado em Metas</span>
          <span className="text-xl font-mono font-bold text-[#00D284] mt-1 block">
            {formatCurrency(totalCurrent)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Valor já guardado e protegido</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Objetivo Total Acumulado</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">
            {formatCurrency(totalTarget)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">{goals.length} metas ativas</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Falta Acumular</span>
          <span className="text-xl font-mono font-bold text-brand-blue mt-1 block">
            {formatCurrency(totalRemaining)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Restante para realizar todos os planos</span>
        </div>

        <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-500 block">Progresso Médio Global</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-mono font-bold text-white">
              {overallProgress.toFixed(1)}%
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00D284]/15 text-[#00D284]">
              {overallProgress >= 75 ? 'Reta Final' : overallProgress >= 40 ? 'Em Andamento' : 'Iniciando'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#151926] rounded-full overflow-hidden mt-2 border border-[#202638]">
            <div 
              className="h-full bg-gradient-to-r from-brand-blue to-[#00D284] rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      {goals.length === 0 ? (
        <div className="bg-[#11141e] border border-[#1d2232] rounded-3xl p-12 text-center space-y-4">
          <Target className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhuma meta financeira cadastrada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Defina objetivos como viagens, compra de veículo ou casa própria e acompanhe a evolução mês a mês.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold"
          >
            Cadastrar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => {
            const IconComponent = CATEGORY_ICONS[goal.category] || Compass;
            const progress = goal.targetAmount > 0 
              ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) 
              : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const monthsLeft = getMonthsLeft(goal.deadline);
            const monthlyPaceNeeded = monthsLeft ? remaining / monthsLeft : null;

            return (
              <div 
                key={goal.id} 
                className="bg-[#11141e] border border-[#1d2232] hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition duration-200 group"
              >
                
                {/* Top Item: Icon + Category Badge + Actions */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                        style={{ backgroundColor: goal.color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          {goal.category}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug truncate max-w-[170px]">
                          {goal.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => openEdit(goal)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#151926] transition"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Deseja excluir a meta "${goal.title}"?`)) {
                            deleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#151926] transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes / Subtitle */}
                  {goal.notes && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {goal.notes}
                    </p>
                  )}
                </div>

                {/* Middle: Progress & Values */}
                <div className="space-y-3 bg-[#151926]/60 p-4 rounded-2xl border border-[#202638]">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Acumulado</span>
                      <span className="text-base font-mono font-bold text-white">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Objetivo</span>
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2.5 w-full bg-[#0b0e17] rounded-full overflow-hidden p-0.5 border border-[#202638]">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: progress >= 100 ? '#00D284' : goal.color 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>{progress.toFixed(1)}% concluído</span>
                      <span>Faltam {formatCurrency(remaining)}</span>
                    </div>
                  </div>
                </div>

                {/* Simulation & Deadline Insights */}
                <div className="space-y-2 text-xs">
                  {goal.deadline && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Prazo estimado:
                      </span>
                      <span className="font-semibold text-white">
                        {new Date(goal.deadline).toLocaleDateString('pt-BR')} ({monthsLeft} meses)
                      </span>
                    </div>
                  )}

                  {monthlyPaceNeeded && remaining > 0 && (
                    <div className="p-2.5 bg-brand-blue/10 border border-brand-blue/20 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
                      <span>Aporte mensal sugerido:</span>
                      <span className="font-mono font-bold text-brand-blue">
                        {formatCurrency(monthlyPaceNeeded)}/mês
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#1b202e]">
                  <button
                    onClick={() => openContribute(goal, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#00D284]/15 hover:bg-[#00D284]/25 text-[#00D284] border border-[#00D284]/30 rounded-xl text-xs font-bold transition active:scale-95"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+ Aportar</span>
                  </button>

                  <button
                    onClick={() => openContribute(goal, true)}
                    className="px-3.5 py-2.5 bg-[#151926] hover:bg-[#1f2538] text-slate-400 hover:text-white border border-[#202638] rounded-xl text-xs font-semibold transition"
                    title="Resgatar valor da meta"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar / Editar Meta */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="text-base font-bold text-white">
              {editingGoalId ? 'Editar Meta Financeira' : 'Criar Nova Meta ou Sonho'}
            </h3>

            <form onSubmit={handleSaveGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Título da Meta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Viagem Japão, Reforma Apartamento, Carro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Valor Alvo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 25000.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Saldo Atual Guardado</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5000.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Data Limite (Prazo)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="Viagem">Viagem & Férias</option>
                    <option value="Imóvel">Imóvel & Casa Própria</option>
                    <option value="Veículo">Veículo / Carro</option>
                    <option value="Educação">Educação & Cursos</option>
                    <option value="Investimentos">Investimentos / FIRE</option>
                    <option value="Reserva">Reserva de Segurança</option>
                    <option value="Outros">Outro Projeto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cor de Destaque</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-8 rounded border border-[#202638] bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-slate-400">{color}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notas / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Foco para o final do ano, passagens cotadas em USD..."
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
                  {editingGoalId ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aportar / Resgatar */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isWithdrawal ? (
                  <ArrowDownRight className="w-5 h-5 text-amber-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-[#00D284]" />
                )}
                <span>{isWithdrawal ? 'Resgatar da Meta' : 'Aportar na Meta'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Meta: <strong className="text-white">{selectedGoal.title}</strong> (Saldo: {formatCurrency(selectedGoal.currentAmount)})
              </p>
            </div>

            <form onSubmit={handleContribute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Valor da Movimentação (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="Ex: 500.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2.5 font-mono text-white text-base focus:outline-none focus:border-brand-blue"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {isWithdrawal 
                  ? 'O valor será subtraído do saldo da meta e registrado como receita de resgate.'
                  : 'O valor será somado ao saldo da meta e registrado como investimento/poupança no mês.'}
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="px-4 py-2 bg-[#151926] hover:bg-[#1d2436] text-slate-400 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-lg transition ${
                    isWithdrawal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#00D284] hover:bg-emerald-600'
                  }`}
                >
                  {isWithdrawal ? 'Confirmar Resgate' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
