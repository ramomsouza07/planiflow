import React from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  PieChart, 
  Coins,
  Settings,
  Sliders, 
  RotateCcw,
  Receipt,
  FileDown,
  FileUp,
  LogOut,
  ShieldCheck,
  CreditCard,
  CalendarClock,
  Target,
  Award
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, parseCSV } from '../utils/csv';

export type ViewType = 
  | 'dashboard' 
  | 'operacoes' 
  | 'cards'
  | 'subscriptions'
  | 'goals'
  | 'score'
  | 'spreadsheet' 
  | 'analytics' 
  | 'investments' 
  | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isMobile = false,
}) => {
  const { filteredTransactions, bulkAddTransactions, clearAllTransactions, loadSampleData, transactions } = useFinance();
  const { user, logout } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await parseCSV(file);
        if (imported.length > 0) {
          bulkAddTransactions(imported);
        }
      } catch {
        alert('Erro ao processar CSV.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className={`shrink-0 flex flex-col justify-between p-5 border-r border-[#1b202e] bg-[#0b0e17]/95 min-h-screen ${isMobile ? 'w-full flex' : 'w-64 hidden lg:flex'}`}>
      <div className="space-y-7">
        
        {/* PlaniFlow Logo */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <img 
            src="/planiflow.png" 
            alt="PlaniFlow" 
            className="w-8 h-8 rounded-xl object-contain shadow-md shadow-brand-blue/20"
          />
          <div>
            <span className="text-lg font-bold tracking-tight text-white">PlaniFlow</span>
            <span className="block text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Gestão Financeira</span>
          </div>
        </div>

        {/* User Greeting matching ref.jpg */}
        <div className="px-2">
          <h2 className="text-xl font-bold text-white tracking-tight leading-tight truncate">
            Olá, {user?.name ? user.name.split(' ')[0] : 'Investidor'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visão geral do seu fluxo mensal
          </p>
        </div>

        {/* Main Menu matching ref.jpg */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Menu Principal
          </div>

          <button
            onClick={() => onSelectView('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'dashboard'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectView('operacoes')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'operacoes'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#00d284]" />
            <span>Operações</span>
          </button>

          <button
            onClick={() => onSelectView('cards')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'cards'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span>Cartões & Faturas</span>
          </button>

          <button
            onClick={() => onSelectView('subscriptions')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'subscriptions'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <CalendarClock className="w-4 h-4 text-amber-400" />
            <span>Assinaturas & Fixas</span>
          </button>

          <button
            onClick={() => onSelectView('goals')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'goals'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Metas & Sonhos</span>
          </button>

          <button
            onClick={() => onSelectView('score')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'score'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Score Financeiro</span>
          </button>

          <button
            onClick={() => onSelectView('spreadsheet')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'spreadsheet'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Planilha</span>
          </button>

          <button
            onClick={() => onSelectView('analytics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'analytics'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Análise</span>
          </button>

          <button
            onClick={() => onSelectView('investments')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'investments'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Investimentos</span>
          </button>

          <button
            onClick={() => onSelectView('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'settings'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                : 'text-slate-400 hover:text-white hover:bg-[#141724]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Data Tools */}
        <div className="space-y-1 pt-2 border-t border-[#1b202e]">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Planilha & Dados
          </div>

          <button
            onClick={() => exportToCSV(filteredTransactions)}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#141724] transition"
          >
            <FileDown className="w-4 h-4 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#141724] transition"
          >
            <FileUp className="w-4 h-4 text-slate-400" />
            <span>Importar CSV</span>
          </button>

          {transactions.length === 0 ? (
            <button
              onClick={loadSampleData}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#141724] transition"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Carregar Exemplo</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todos os lançamentos?')) {
                  clearAllTransactions();
                }
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-[#141724] transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Limpar Dados</span>
            </button>
          )}
        </div>

      </div>

      {/* User Profile Footer Card */}
      <div className="pt-4 border-t border-[#1b202e] space-y-2">
        {/* AES-256 Security Status */}
        <div 
          onClick={() => onSelectView('settings')}
          className="flex items-center justify-between px-3 py-2 bg-[#121522] border border-[#1e2436] rounded-xl cursor-pointer hover:border-[#00d284]/40 transition group"
          title="Ver Central de Segurança & Criptografia"
        >
          <div className="flex items-center gap-2 text-[11px] text-slate-400 group-hover:text-slate-200 transition">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00d284]" />
            <span className="font-medium">Proteção AES-256</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d284] animate-pulse" />
        </div>

        <div 
          onClick={() => onSelectView('settings')}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#141724] cursor-pointer transition"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-blue to-teal-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'Usuário'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            className="p-1 text-slate-500 hover:text-[#ff4d6a] rounded transition shrink-0"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
