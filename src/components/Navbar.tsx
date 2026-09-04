import React, { useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMonthYear } from '../utils/formatters';
import { exportToCSV, parseCSV } from '../utils/csv';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Download, 
  Upload, 
  Calendar
} from 'lucide-react';

interface NavbarProps {
  onOpenNewModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewModal }) => {
  const { 
    selectedMonth, 
    setSelectedMonth, 
    bulkAddTransactions, 
    filteredTransactions 
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigate to previous or next month
  const handleMonthChange = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  const handleExport = () => {
    exportToCSV(filteredTransactions, `finflow-${selectedMonth}.csv`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await parseCSV(file);
        if (imported.length > 0) {
          bulkAddTransactions(imported);
          alert(`${imported.length} transações importadas com sucesso da planilha!`);
        } else {
          alert('Nenhuma transação válida encontrada no arquivo.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao ler arquivo CSV. Verifique o formato.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <img 
              src="/planiflow.png" 
              alt="PlaniFlow" 
              className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-brand-blue/20" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  PlaniFlow
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-blue/15 text-brand-blue border border-brand-blue/30">
                  Gestão Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Controle Mensal de Gastos e Entradas</p>
            </div>
          </div>

          {/* Month Selector in mobile inside the top bar */}
          <div className="flex md:hidden items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg p-1">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-1 text-slate-200">
              {formatMonthYear(selectedMonth)}
            </span>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Selector Desktop */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2 py-1.5 shadow-inner">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold tracking-wide text-slate-100 min-w-[150px] text-center capitalize">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Export CSV */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition hover:text-white shadow-sm"
            title="Exportar dados visíveis para CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Import CSV */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition hover:text-white shadow-sm"
            title="Importar transações de arquivo CSV"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Importar CSV</span>
          </button>

          {/* New Transaction Button */}
          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Operação</span>
          </button>
        </div>

      </div>
    </header>
  );
};
