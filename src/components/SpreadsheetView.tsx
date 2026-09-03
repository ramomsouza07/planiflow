import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionsOverview } from './TransactionsOverview';
import type { Transaction } from '../types/finance';
import { exportToCSV } from '../utils/csv';
import { FileSpreadsheet, Download, PlusCircle } from 'lucide-react';

interface SpreadsheetViewProps {
  onEditTransaction: (tx: Transaction) => void;
  onGoToOperacoes?: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  onEditTransaction,
  onGoToOperacoes,
}) => {
  const { filteredTransactions, selectedMonth } = useFinance();

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-blue" />
            Planilha de Controle Financeiro
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie cada entrada e saída do mês de {selectedMonth} com edição rápida
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filteredTransactions, `planilha-${selectedMonth}.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151926] hover:bg-[#1a2133] border border-[#202638] text-slate-300 hover:text-white rounded-full text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-brand-blue" />
            <span>Exportar CSV</span>
          </button>

          {onGoToOperacoes && (
            <button
              onClick={onGoToOperacoes}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-blue hover:bg-brand-blueHover text-white rounded-full text-xs font-bold shadow-lg shadow-brand-blue/25 transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Cadastrar na Central</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Full-width Spreadsheet Table */}
      <TransactionsOverview 
        onEditTransaction={onEditTransaction}
        onGoToOperacoes={onGoToOperacoes}
      />

    </div>
  );
};
