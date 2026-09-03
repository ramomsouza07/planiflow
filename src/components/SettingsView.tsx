import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  LogOut, 
  Tag, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { 
    categories, 
    addCategory, 
    transactions, 
    investments, 
    emergencyFund, 
    bulkAddTransactions, 
    clearAllTransactions 
  } = useFinance();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [income, setIncome] = useState((user?.monthlyIncomeEstimate || '').toString());
  const [savingsGoal, setSavingsGoal] = useState((user?.savingsGoalPercentage || 20).toString());
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'BRL');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('#0066FF');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      monthlyIncomeEstimate: parseFloat(income.replace(',', '.')) || 0,
      savingsGoalPercentage: parseInt(savingsGoal, 10) || 20,
      preferredCurrency: currency as any,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      icon: 'Tag',
    });

    setNewCatName('');
  };

  const handleExportBackup = () => {
    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      user,
      transactions,
      categories,
      investments,
      emergencyFund,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.transactions && Array.isArray(parsed.transactions)) {
            bulkAddTransactions(parsed.transactions);
            alert('Backup restaurado com sucesso!');
          }
        } catch {
          alert('Arquivo de backup inválido.');
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-brand-blue" />
          Configurações & Painel do Usuário
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie suas preferências de conta, perfil e dados do sistema
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-[#00d284]/15 border border-[#00d284]/30 rounded-2xl text-xs text-[#00d284] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Alterações salvas com sucesso!</span>
        </div>
      )}

      {/* 1. Painel do Usuário / Perfil */}
      <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b202e]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-teal-400 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-brand-blue/25">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{user?.name || 'Investidor'}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-[#151926] hover:bg-[#ff4d6a]/15 text-slate-400 hover:text-[#ff4d6a] border border-[#202638] rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Renda Mensal Estimada (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 6000.00"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Meta de Poupança Mensal (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Moeda Principal</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-blue"
              >
                <option value="BRL">Real Brasileiro (R$)</option>
                <option value="USD">Dólar Americano ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blueHover text-white rounded-xl font-bold shadow-lg shadow-brand-blue/25 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Preferências</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Gerenciador de Categorias */}
      <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b202e]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-blue" />
              Gerenciador de Categorias
            </h3>
            <p className="text-[11px] text-slate-500">
              Personalize e crie novas categorias para suas despesas e receitas
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{categories.length} categorias</span>
        </div>

        {/* Add new category inline */}
        <form onSubmit={handleAddCategory} className="bg-[#151926] p-3 rounded-xl border border-[#202638] flex flex-col sm:flex-row items-center gap-2.5 text-xs">
          <input
            type="text"
            required
            placeholder="Nome da nova categoria..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-[#0b0e17] border border-[#202638] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand-blue w-full sm:w-auto"
          />

          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as any)}
            className="bg-[#0b0e17] border border-[#202638] rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          >
            <option value="expense">Saída (Gasto)</option>
            <option value="income">Entrada (Receita)</option>
          </select>

          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="w-8 h-8 rounded border border-[#202638] bg-transparent cursor-pointer"
            title="Escolher cor"
          />

          <button
            type="submit"
            className="px-4 py-1.5 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-lg transition shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </form>

        {/* Categories Chips */}
        <div className="flex flex-wrap gap-2 pt-2 max-h-48 overflow-y-auto">
          {categories.map((c) => (
            <div
              key={c.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#151926] border border-[#202638]"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-slate-200">{c.name}</span>
              <span className="text-[10px] text-slate-500 uppercase">({c.type === 'income' ? 'Entrada' : 'Saída'})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Dados, Backup & Restauração */}
      <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-brand-blue" />
          Backup & Exportação de Segurança
        </h3>
        <p className="text-xs text-slate-500">
          Faça download de um arquivo JSON completo com seus lançamentos, carteira e metas para salvar ou migrar para outro dispositivo.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blueHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-blue/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Backup Completo (JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#151926] hover:bg-[#1f2538] text-slate-300 hover:text-white border border-[#202638] rounded-xl text-xs font-bold transition"
          >
            <Upload className="w-4 h-4 text-brand-blue" />
            <span>Restaurar Backup de Arquivo</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Atenção: Todos os dados salvos nesta máquina serão apagados. Deseja continuar?')) {
                clearAllTransactions();
                alert('Dados limpos com sucesso.');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ff4d6a]/10 hover:bg-[#ff4d6a]/20 text-[#ff4d6a] border border-[#ff4d6a]/30 rounded-xl text-xs font-bold transition ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Todos os Dados</span>
          </button>
        </div>
      </div>

    </div>
  );
};
