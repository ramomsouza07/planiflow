import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar, type ViewType } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { TopMetrics } from './components/TopMetrics';
import { PerformanceChart } from './components/PerformanceChart';
import { TransactionsOverview } from './components/TransactionsOverview';
import { CategoryWatchlist } from './components/CategoryWatchlist';
import { SpreadsheetView } from './components/SpreadsheetView';
import { AnalyticsView } from './components/AnalyticsView';
import { InvestmentsView } from './components/InvestmentsView';
import { SettingsView } from './components/SettingsView';
import { OperacoesView } from './components/OperacoesView';
import { CardsView } from './components/CardsView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { GoalsView } from './components/GoalsView';
import { FinancialScoreView } from './components/FinancialScoreView';
import { AuthScreen } from './components/AuthScreen';
import type { Transaction } from './types/finance';

const DashboardContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // If not logged in, show authentication screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setCurrentView('operacoes');
  };

  const handleGoToOperacoes = () => {
    setEditingTransaction(null);
    setCurrentView('operacoes');
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-row font-sans selection:bg-brand-blue selection:text-white">
      
      {/* Sidebar matching ref.jpg */}
      <Sidebar 
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          setIsMobileSidebarOpen(false);
        }}
      />

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-[#0b0e17] border-r border-[#1b202e] p-4 flex flex-col">
            <Sidebar 
              currentView={currentView}
              onSelectView={(v) => {
                setCurrentView(v);
                setIsMobileSidebarOpen(false);
              }}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header matching ref.jpg */}
        <TopHeader 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenSettings={() => setCurrentView('settings')}
        />

        {/* Dynamic View Content based on active sidebar tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          
          {currentView === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Row: Total Holding + Mini Metric Cards */}
              <TopMetrics 
                onGoToOperacoes={handleGoToOperacoes} 
                onGoToScore={() => setCurrentView('score')}
              />

              {/* Middle Row: Large Portfolio Performance Wave Chart */}
              <PerformanceChart />

              {/* Bottom Row: Portfolio Overview Table (70%) + Watchlist (30%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <TransactionsOverview 
                    onEditTransaction={handleEditTransaction}
                    onGoToOperacoes={handleGoToOperacoes}
                  />
                </div>
                
                <div className="lg:col-span-4">
                  <CategoryWatchlist />
                </div>
              </div>
            </div>
          )}

          {currentView === 'operacoes' && (
            <OperacoesView 
              editingTransaction={editingTransaction}
              onClearEditingTransaction={() => setEditingTransaction(null)}
              onGoToSpreadsheet={() => setCurrentView('spreadsheet')}
              onGoToAnalytics={() => setCurrentView('analytics')}
            />
          )}

          {currentView === 'cards' && (
            <CardsView onGoToOperacoes={handleGoToOperacoes} />
          )}

          {currentView === 'subscriptions' && (
            <SubscriptionsView />
          )}

          {currentView === 'goals' && (
            <GoalsView />
          )}

          {currentView === 'score' && (
            <FinancialScoreView onGoToOperacoes={handleGoToOperacoes} />
          )}

          {currentView === 'spreadsheet' && (
            <SpreadsheetView 
              onEditTransaction={handleEditTransaction}
              onGoToOperacoes={handleGoToOperacoes}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView 
              onGoToOperacoes={handleGoToOperacoes}
            />
          )}

          {currentView === 'investments' && (
            <InvestmentsView />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}

        </main>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <DashboardContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
