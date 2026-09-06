import React from 'react';
import { Search, ChevronLeft, ChevronRight, Bell, Menu, ShieldCheck } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatMonthYear } from '../utils/formatters';
import { breakHashSync } from '../utils/clientEncryption';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const { selectedMonth, setSelectedMonth, filters, setFilters } = useFinance();
  const { user } = useAuth();

  const cleanName = user?.name 
    ? (user.name.startsWith('enc:v1:') ? breakHashSync(user.name, user.email ? user.email.split('@')[0] : 'Meu Painel') : user.name) 
    : '';

  const cleanEmail = user?.email 
    ? (user.email.startsWith('enc:v1:') ? breakHashSync(user.email, '') : user.email) 
    : '';

  const handleMonthChange = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  return (
    <header className="h-16 px-4 lg:px-8 border-b border-[#1b202e] bg-[#0b0e17]/90 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-20">
      
      {/* Left items: Mobile toggle + quick category pills */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 lg:hidden text-slate-400 hover:text-white rounded-lg hover:bg-[#151926] transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Month Navigator pill */}
        <div className="flex items-center bg-[#131622] border border-[#202638] rounded-full p-1 shadow-inner">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-[#1d2334] transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold px-3 text-slate-200 capitalize select-none min-w-[120px] text-center">
            {formatMonthYear(selectedMonth)}
          </span>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-[#1d2334] transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Search input pill matching ref.jpg */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição, valor ou categoria..."
            value={filters.searchQuery || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full bg-[#131622] border border-[#202638] rounded-full pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-blue transition"
          />
        </div>
      </div>

      {/* Right items: Security badge, Notification icon, Profile pill */}
      <div className="flex items-center gap-3">
        {/* Security badge pill */}
        <div 
          onClick={onOpenSettings}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131722] border border-[#202638] text-[10px] text-slate-400 hover:text-white hover:border-[#00d284]/40 cursor-pointer transition"
          title="Seus dados estão protegidos com criptografia AES-256"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#00d284]" />
          <span className="font-semibold text-slate-300">Criptografia AES-256</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d284] animate-pulse" />
        </div>

        <button 
          className="w-9 h-9 rounded-full bg-[#131622] border border-[#202638] flex items-center justify-center text-slate-400 hover:text-white transition"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User profile avatar matching ref.jpg - clickable to open Settings */}
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 pl-2 border-l border-[#1b202e] cursor-pointer hover:opacity-80 transition group"
          title="Painel do Usuário & Configurações"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand-blue/20">
            {((cleanName || 'U').charAt(0)).toUpperCase()}
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <div className="text-xs font-bold text-white group-hover:text-brand-blue transition truncate max-w-[120px]">
              {cleanName || 'Meu Painel'}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
              {cleanEmail || user?.email || 'Gerenciar'}
            </div>
          </div>
        </div>

      </div>

    </header>
  );
};
