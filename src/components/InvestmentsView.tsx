import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { cleanText } from '../utils/clientEncryption';
import type { InvestmentAsset, InvestmentType } from '../types/finance';
import { INVESTMENT_TYPE_LABELS } from '../types/finance';
import { 
  fetchLiveMarketOverview, 
  fetchAssetQuote,
  calculateLiveYieldProjections,
  getEstimatedMonthlyYield,
  type MarketOverview 
} from '../services/financialApi';
import { 
  ShieldCheck, 
  PieChart as PieIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Coins, 
  X,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calculator,
  Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PALETTE = ['#0066FF', '#00D284', '#9B51E0', '#FFA800', '#00C4DF', '#FF4D6A'];

export const InvestmentsView: React.FC = () => {
  const { 
    investments, 
    emergencyFund, 
    updateEmergencyFund, 
    addInvestment, 
    updateInvestment, 
    deleteInvestment,
    monthlySummary 
  } = useFinance();

  const [marketRates, setMarketRates] = useState<MarketOverview | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<InvestmentType>('renda_fixa');
  const [institution, setInstitution] = useState('');
  const [totalInvested, setTotalInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [monthlyYield, setMonthlyYield] = useState('');
  const [notes, setNotes] = useState('');
  const [isSearchingQuote, setIsSearchingQuote] = useState(false);
  const [quoteSearchMsg, setQuoteSearchMsg] = useState('');
  const [autoYieldMsg, setAutoYieldMsg] = useState('');

  // Emergency fund editing state
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [efMonths, setEfMonths] = useState(emergencyFund.targetMonths.toString());
  const [efCurrent, setEfCurrent] = useState(emergencyFund.currentAmount.toString());
  const [efInstitution, setEfInstitution] = useState(emergencyFund.institution);

  // Simulator amount state
  const [simAmount, setSimAmount] = useState<string>('10000');

  // Load real-time market overview
  const loadRates = async () => {
    setIsLoadingRates(true);
    try {
      const data = await fetchLiveMarketOverview();
      setMarketRates(data);
    } catch {
      // ignore
    }
    setIsLoadingRates(false);
  };

  useEffect(() => {
    loadRates();
  }, []);

  // Calculations
  const averageMonthlyExpense = monthlySummary.totalExpense > 0 ? monthlySummary.totalExpense : 2500;
  const targetEmergencyAmount = emergencyFund.customTargetAmount && emergencyFund.customTargetAmount > 0 
    ? emergencyFund.customTargetAmount 
    : emergencyFund.targetMonths * averageMonthlyExpense;
  
  const emergencyProgress = targetEmergencyAmount > 0 
    ? Math.min(100, (emergencyFund.currentAmount / targetEmergencyAmount) * 100) 
    : 0;
  
  const monthsCovered = averageMonthlyExpense > 0 
    ? (emergencyFund.currentAmount / averageMonthlyExpense).toFixed(1) 
    : '0.0';

  // Portfolio stats
  const totalPortfolioValue = investments.reduce((acc, i) => acc + i.currentValue, 0) + emergencyFund.currentAmount;
  const totalInvestedAmount = investments.reduce((acc, i) => acc + i.totalInvested, 0) + emergencyFund.currentAmount;
  const totalMonthlyYield = investments.reduce((acc, i) => acc + (i.monthlyYield || 0), 0);
  const portfolioProfit = totalPortfolioValue - totalInvestedAmount;

  // Live yield simulation projections
  const simulatedYieldProjections = useMemo(() => {
    if (!marketRates) return [];
    const principal = parseFloat(simAmount.replace(',', '.')) || 0;
    return calculateLiveYieldProjections(principal, marketRates);
  }, [simAmount, marketRates]);

  // Allocation data for Pie Chart
  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};
    if (emergencyFund.currentAmount > 0) {
      map['Reserva de Emergência'] = emergencyFund.currentAmount;
    }
    investments.forEach(inv => {
      const label = INVESTMENT_TYPE_LABELS[inv.type] || inv.type;
      map[label] = (map[label] || 0) + inv.currentValue;
    });

    return Object.entries(map).map(([name, value], index) => ({
      name,
      value,
      color: PALETTE[index % PALETTE.length],
      percentage: totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0,
    }));
  }, [investments, emergencyFund, totalPortfolioValue]);

  const handleOpenNewAsset = () => {
    setEditingAsset(null);
    setName('');
    setTicker('');
    setType('renda_fixa');
    setInstitution('');
    setTotalInvested('');
    setCurrentValue('');
    setMonthlyYield('');
    setNotes('');
    setQuoteSearchMsg('');
    setAutoYieldMsg('');
    setIsAssetModalOpen(true);
  };

  const handleEditAsset = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setName(cleanText(asset.name));
    setTicker(cleanText(asset.ticker || ''));
    setType(asset.type);
    setInstitution(cleanText(asset.institution));
    setTotalInvested(asset.totalInvested.toString());
    setCurrentValue(asset.currentValue.toString());
    setMonthlyYield((asset.monthlyYield || 0).toString());
    setNotes(cleanText(asset.notes || ''));
    setQuoteSearchMsg('');
    setAutoYieldMsg('');
    setIsAssetModalOpen(true);
  };

  const handleSearchTicker = async () => {
    if (!ticker.trim()) return;
    setIsSearchingQuote(true);
    setQuoteSearchMsg('');
    const quote = await fetchAssetQuote(ticker);
    if (quote) {
      if (!name) setName(quote.name);
      setCurrentValue(quote.price.toFixed(2));
      if (!totalInvested) setTotalInvested(quote.price.toFixed(2));
      if (quote.type === 'fii') setType('fiis');
      else if (quote.type === 'stock') setType('acoes');
      else if (quote.type === 'crypto') setType('cripto');
      setQuoteSearchMsg(`Cotação encontrada: ${formatCurrency(quote.price)} (${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)}%)`);
    } else {
      setQuoteSearchMsg('Cotação não localizada. Você pode preencher os valores manualmente.');
    }
    setIsSearchingQuote(false);
  };

  // Calculate yield automatically using API rates
  const handleAutoCalculateYield = () => {
    if (!marketRates) return;
    const principal = parseFloat(totalInvested.replace(',', '.')) || parseFloat(currentValue.replace(',', '.')) || 0;
    if (principal <= 0) {
      setAutoYieldMsg('Informe primeiro o valor aplicado para calcular o rendimento.');
      return;
    }

    const estimatedMonthly = getEstimatedMonthlyYield(principal, type, marketRates);
    setMonthlyYield(estimatedMonthly.toFixed(2));

    if (type === 'renda_fixa' || type === 'reserva') {
      setAutoYieldMsg(`Calculado: ${formatCurrency(estimatedMonthly)}/mês com base em 100% do CDI atual (${marketRates.cdi.toFixed(2)}% a.a.)`);
    } else if (type === 'fiis') {
      setAutoYieldMsg(`Calculado: ${formatCurrency(estimatedMonthly)}/mês com base na média de mercado para FIIs (~0,85%/mês)`);
    } else if (type === 'acoes') {
      setAutoYieldMsg(`Calculado: ${formatCurrency(estimatedMonthly)}/mês com base no DY médio de ações (~0,50%/mês)`);
    } else {
      setAutoYieldMsg(`Calculado: ${formatCurrency(estimatedMonthly)}/mês`);
    }
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const investedNum = parseFloat(totalInvested.replace(',', '.')) || 0;
    const currentNum = parseFloat(currentValue.replace(',', '.')) || investedNum;
    const yieldNum = parseFloat(monthlyYield.replace(',', '.')) || 0;

    if (!name.trim()) return;

    if (editingAsset) {
      updateInvestment(editingAsset.id, {
        name: name.trim(),
        ticker: ticker.trim().toUpperCase(),
        type,
        institution: institution.trim() || 'Corretora',
        totalInvested: investedNum,
        currentValue: currentNum,
        monthlyYield: yieldNum,
        notes: notes.trim(),
      });
    } else {
      addInvestment({
        name: name.trim(),
        ticker: ticker.trim().toUpperCase(),
        type,
        institution: institution.trim() || 'Corretora',
        totalInvested: investedNum,
        currentValue: currentNum,
        monthlyYield: yieldNum,
        notes: notes.trim(),
      });
    }

    setIsAssetModalOpen(false);
  };

  const handleSaveEmergencyFund = () => {
    updateEmergencyFund({
      targetMonths: parseInt(efMonths, 10) || 6,
      currentAmount: parseFloat(efCurrent.replace(',', '.')) || 0,
      institution: efInstitution,
    });
    setIsEditingEmergency(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-blue" />
            Investimentos & Inteligência de Rendimentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe seu patrimônio, reserva de emergência e simule rendimentos com taxas oficiais em tempo real
          </p>
        </div>

        <button
          onClick={loadRates}
          disabled={isLoadingRates}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#151926] hover:bg-[#1f2538] border border-[#202638] text-slate-400 hover:text-white rounded-full text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
          title="Atualizar cotações do mercado"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-blue ${isLoadingRates ? 'animate-spin' : ''}`} />
          <span>{isLoadingRates ? 'Atualizando...' : 'Atualizar Taxas da API'}</span>
        </button>
      </div>

      {/* Live Financial API Indicators Bar */}
      {marketRates && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Taxa Selic</span>
            <div className="text-base font-bold font-mono text-white mt-1">
              {marketRates.selic.toFixed(2)}% <span className="text-[10px] text-slate-500 font-normal">a.a.</span>
            </div>
            <span className="text-[10px] text-[#00d284] font-semibold mt-1">Banco Central (BCB)</span>
          </div>

          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Taxa CDI</span>
            <div className="text-base font-bold font-mono text-white mt-1">
              {marketRates.cdi.toFixed(2)}% <span className="text-[10px] text-slate-500 font-normal">a.a.</span>
            </div>
            <span className="text-[10px] text-[#00d284] font-semibold mt-1">B3 / Renda Fixa</span>
          </div>

          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Poupança</span>
            <div className="text-base font-bold font-mono text-white mt-1">
              {marketRates.poupanca.toFixed(2)}% <span className="text-[10px] text-slate-500 font-normal">a.a.</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">Isenta de IR</span>
          </div>

          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">IPCA (Inflação)</span>
            <div className="text-base font-bold font-mono text-white mt-1">
              {marketRates.ipca.toFixed(2)}% <span className="text-[10px] text-slate-500 font-normal">acum.</span>
            </div>
            <span className="text-[10px] text-amber-400 font-semibold mt-1">IBGE</span>
          </div>

          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Dólar Comercial</span>
            <div className="text-base font-bold font-mono text-white mt-1">
              {formatCurrency(marketRates.usd)}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold mt-1">
              {marketRates.usdChange >= 0 ? (
                <span className="text-[#00d284] flex items-center"><TrendingUp className="w-2.5 h-2.5 mr-0.5" />+{marketRates.usdChange}%</span>
              ) : (
                <span className="text-[#ff4d6a] flex items-center"><TrendingDown className="w-2.5 h-2.5 mr-0.5" />{marketRates.usdChange}%</span>
              )}
            </div>
          </div>

          <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Bitcoin (BTC)</span>
            <div className="text-base font-bold font-mono text-white mt-1 truncate">
              {formatCurrency(marketRates.btc)}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold mt-1">
              {marketRates.btcChange >= 0 ? (
                <span className="text-[#00d284] flex items-center"><TrendingUp className="w-2.5 h-2.5 mr-0.5" />+{marketRates.btcChange}%</span>
              ) : (
                <span className="text-[#ff4d6a] flex items-center"><TrendingDown className="w-2.5 h-2.5 mr-0.5" />{marketRates.btcChange}%</span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* CALCULADORA & SIMULADOR DE RENDIMENTOS (API EXTERNA) */}
      {marketRates && (
        <div className="bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b202e]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-blue">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Simulador & Comparador de Rendimentos em Tempo Real</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00d284]/15 text-[#00d284] border border-[#00d284]/30">
                    Dados ao Vivo da API
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Veja quanto rende seu dinheiro nos principais investimentos com base no CDI ({marketRates.cdi.toFixed(2)}% a.a.) e Selic ({marketRates.selic.toFixed(2)}% a.a.)
                </p>
              </div>
            </div>

            {/* Quick Simulation Input */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400">R$</span>
                <input
                  type="number"
                  step="100"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-36 bg-[#151926] border border-[#202638] rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-brand-blue"
                  placeholder="Valor..."
                />
              </div>

              {totalPortfolioValue > 0 && (
                <button
                  onClick={() => setSimAmount(totalPortfolioValue.toFixed(2))}
                  className="px-3 py-1.5 bg-[#151926] hover:bg-[#1f2538] text-slate-300 hover:text-white border border-[#202638] rounded-xl text-[11px] font-semibold transition"
                  title="Usar o valor total do seu patrimônio atual"
                >
                  Usar Meu Total
                </button>
              )}
            </div>
          </div>

          {/* Quick presets for simulation */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] text-slate-500 font-semibold">Simular valores rápidos:</span>
            {[1000, 5000, 10000, 25000, 50000, 100000].map(val => (
              <button
                key={val}
                onClick={() => setSimAmount(val.toString())}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                  simAmount === val.toString()
                    ? 'bg-brand-blue text-white font-bold'
                    : 'bg-[#151926] text-slate-400 hover:text-white border border-[#202638]'
                }`}
              >
                R$ {val.toLocaleString('pt-BR')}
              </button>
            ))}
          </div>

          {/* Comparative Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {simulatedYieldProjections.map((item) => {
              const poupancaItem = simulatedYieldProjections.find(p => p.id === 'poupanca');
              const extraGainOneYear = poupancaItem && item.id !== 'poupanca' 
                ? item.oneYearReturnR$ - poupancaItem.oneYearReturnR$ 
                : 0;

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.id === 'cdb-115' || item.id === 'lci-lca'
                      ? 'bg-[#131826] border-brand-blue/40 shadow-lg shadow-brand-blue/5'
                      : 'bg-[#141824] border-[#202638]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#202638]">
                    <div>
                      <span className="font-bold text-xs text-white block">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.benchmarkLabel}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isTaxFree ? 'bg-[#00d284]/15 text-[#00d284]' : 'bg-[#1c2233] text-slate-400'
                    }`}>
                      {item.isTaxFree ? 'Isento IR' : 'IR Regressivo'}
                    </span>
                  </div>

                  <div className="pt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Rendimento Mensal:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        +{formatCurrency(item.monthlyReturnR$)}
                        <span className="text-[10px] text-slate-500 font-normal">/mês</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Rendimento em 1 Ano:</span>
                      <span className="font-mono font-bold text-[#00d284] text-sm">
                        +{formatCurrency(item.oneYearReturnR$)}
                      </span>
                    </div>

                    {extraGainOneYear > 0 && (
                      <div className="pt-1.5 border-t border-[#1d2334] flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Ganho vs Poupança:</span>
                        <span className="font-mono font-bold text-[#00d284] bg-[#00d284]/10 px-1.5 py-0.5 rounded">
                          +{formatCurrency(extraGainOneYear)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Top 2 Cards: Emergency Fund (Left) + Portfolio Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Reserva de Emergência Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-blue">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reserva de Emergência</h3>
                <p className="text-[11px] text-slate-500">{cleanText(emergencyFund.institution, 'NuConta / Tesouro Selic')}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingEmergency(!isEditingEmergency)}
              className="text-xs text-slate-400 hover:text-white bg-[#151926] border border-[#202638] px-3 py-1 rounded-full transition"
            >
              {isEditingEmergency ? 'Fechar' : 'Editar Meta'}
            </button>
          </div>

          {isEditingEmergency ? (
            <div className="bg-[#151926] p-4 rounded-2xl border border-[#202638] space-y-3 my-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Saldo Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={efCurrent}
                    onChange={(e) => setEfCurrent(e.target.value)}
                    className="w-full bg-[#0b0e17] border border-[#202638] rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Meta em Meses</label>
                  <input
                    type="number"
                    value={efMonths}
                    onChange={(e) => setEfMonths(e.target.value)}
                    className="w-full bg-[#0b0e17] border border-[#202638] rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Onde está guardado</label>
                  <input
                    type="text"
                    value={efInstitution}
                    onChange={(e) => setEfInstitution(e.target.value)}
                    className="w-full bg-[#0b0e17] border border-[#202638] rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveEmergencyFund}
                className="px-4 py-2 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blueHover transition"
              >
                Salvar Reserva
              </button>
            </div>
          ) : (
            <div className="space-y-4 my-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <span className="text-3xl font-black font-mono text-white">
                    {formatCurrency(emergencyFund.currentAmount)}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    de {formatCurrency(targetEmergencyAmount)} ({emergencyFund.targetMonths} meses)
                  </span>
                </div>
                <div className="text-xs font-bold text-[#00d284] bg-[#00d284]/10 px-2.5 py-1 rounded-full border border-[#00d284]/20 self-start sm:self-auto">
                  {monthsCovered} meses de proteção
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>Progresso da meta</span>
                  <span className="text-white font-mono">{emergencyProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#151926] rounded-full overflow-hidden border border-[#202638]">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-blue to-[#00d284] rounded-full transition-all duration-500"
                    style={{ width: `${emergencyProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[#1b202e] flex items-center justify-between text-[11px] text-slate-500">
            <span>Recomendação: 6 a 12 meses de custo de vida</span>
            <span className="text-slate-400">Gasto base: ~{formatCurrency(averageMonthlyExpense)}/mês</span>
          </div>
        </div>

        {/* 2. Portfolio Total Holding Summary (5 cols) */}
        <div className="lg:col-span-5 bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Patrimônio Global</span>
            <button
              onClick={handleOpenNewAsset}
              className="flex items-center gap-1 text-[11px] font-bold bg-brand-blue hover:bg-brand-blueHover text-white px-3.5 py-1.5 rounded-full shadow-md shadow-brand-blue/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Ativo</span>
            </button>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black font-mono text-white">
              {formatCurrency(totalPortfolioValue)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-slate-400">Lucro / Variação:</span>
              <span className={`font-mono font-bold ${portfolioProfit >= 0 ? 'text-[#00d284]' : 'text-[#ff4d6a]'}`}>
                {portfolioProfit >= 0 ? '+' : ''}{formatCurrency(portfolioProfit)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1b202e] text-xs">
            <div className="bg-[#151926] p-2.5 rounded-2xl border border-[#202638]">
              <div className="text-[10px] text-slate-500 font-medium">Proventos do Mês</div>
              <div className="font-mono font-bold text-[#00d284] text-sm mt-0.5">
                +{formatCurrency(totalMonthlyYield)}
              </div>
            </div>
            <div className="bg-[#151926] p-2.5 rounded-2xl border border-[#202638]">
              <div className="text-[10px] text-slate-500 font-medium">Ativos Cadastrados</div>
              <div className="font-mono font-bold text-white text-sm mt-0.5">
                {investments.length + (emergencyFund.currentAmount > 0 ? 1 : 0)}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Asset Allocation Chart (Left 5 cols) + Assets Table (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Allocation Donut Chart */}
        <div className="lg:col-span-5 bg-[#11141e] border border-[#1d2232] rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-brand-blue" />
              Alocação da Carteira
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Porcentagem</span>
          </div>

          {allocationData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum ativo investido cadastrado.
            </div>
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']} 
                      contentStyle={{ backgroundColor: '#141824', borderColor: '#232a3d', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {allocationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-[#151926] transition">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 truncate font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
                      <span className="text-brand-blue font-bold text-[11px] bg-brand-blue/10 px-1.5 py-0.5 rounded">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Assets Table */}
        <div className="lg:col-span-7 bg-[#11141e] border border-[#1d2232] rounded-3xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1b202e] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#00d284]" />
              Meus Ativos & Aplicações
            </h3>
            <button
              onClick={handleOpenNewAsset}
              className="p-1.5 rounded-full bg-[#151926] text-slate-400 hover:text-white border border-[#202638] transition cursor-pointer"
              title="Adicionar Ativo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-[#1b202e] select-none">
                  <th className="py-3 px-4">Ativo</th>
                  <th className="py-3 px-4">Instituição</th>
                  <th className="py-3 px-4">Aplicado</th>
                  <th className="py-3 px-4">Atual</th>
                  <th className="py-3 px-4">Rendimento</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181c28]">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                      Nenhum ativo cadastrado na carteira.
                      <div className="mt-2">
                        <button
                          onClick={handleOpenNewAsset}
                          className="px-3 py-1.5 bg-brand-blue text-white rounded-full text-[11px] font-bold cursor-pointer"
                        >
                          Adicionar Primeiro Ativo
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  investments.map((asset) => {
                    const profit = asset.currentValue - asset.totalInvested;
                    return (
                      <tr key={asset.id} className="hover:bg-[#141824] transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{cleanText(asset.name, 'Ativo')}</div>
                          <div className="text-[10px] text-slate-500">{asset.ticker ? `${cleanText(asset.ticker)} • ` : ''}{INVESTMENT_TYPE_LABELS[asset.type]}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {cleanText(asset.institution)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {formatCurrency(asset.totalInvested)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {formatCurrency(asset.currentValue)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className={profit >= 0 ? 'text-[#00d284]' : 'text-[#ff4d6a]'}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditAsset(asset)}
                              className="p-1.5 text-slate-400 hover:text-white rounded"
                              title="Editar ativo"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Remover "${asset.name}"?`)) {
                                deleteInvestment(asset.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#ff4d6a] rounded"
                              title="Remover ativo"
                            >
                              <Trash2 className="w-3 h-3" />
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

      {/* Asset Modal with Live API Search and Automatic Yield Calculation */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11141e] border border-[#1d2232] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b202e] bg-[#0c0e15]">
              <h3 className="text-sm font-bold text-white">
                {editingAsset ? 'Editar Ativo' : 'Cadastrar Investimento'}
              </h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-6 space-y-3.5 text-xs">
              
              {/* Ticker API search */}
              <div>
                <label className="block text-slate-400 mb-1">Código / Ticker (Opcional - busca cotação automática)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: PETR4, HGLG11, IVVB11, BTC..."
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="flex-1 bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-brand-blue uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleSearchTicker}
                    disabled={isSearchingQuote || !ticker.trim()}
                    className="px-3.5 py-2 bg-brand-blue hover:bg-brand-blueHover disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar</span>
                  </button>
                </div>
                {quoteSearchMsg && (
                  <p className="text-[11px] text-[#00d284] mt-1 font-medium">{quoteSearchMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nome do Ativo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tesouro Selic 2029, CDB 110% CDI, HGLG11..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Investimento</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as InvestmentType)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-brand-blue"
                  >
                    {Object.entries(INVESTMENT_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Instituição / Corretora</label>
                  <input
                    type="text"
                    placeholder="Ex: XP, NuInvest, Inter..."
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Total Aplicado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={totalInvested}
                    onChange={(e) => setTotalInvested(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Valor Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Deixe vazio se for igual"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Automatic Yield Calculation Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Rendimento Mensal Estimado (R$)</label>
                  {marketRates && (
                    <button
                      type="button"
                      onClick={handleAutoCalculateYield}
                      className="text-[11px] font-bold text-brand-blue hover:text-white flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Calcular com CDI ({marketRates.cdi.toFixed(2)}%)</span>
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={monthlyYield}
                  onChange={(e) => setMonthlyYield(e.target.value)}
                  className="w-full bg-[#151926] border border-[#202638] rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-brand-blue"
                />
                {autoYieldMsg && (
                  <p className="text-[10px] text-[#00d284] font-medium mt-1">{autoYieldMsg}</p>
                )}
              </div>

              <div className="pt-3 border-t border-[#1b202e] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-xl shadow-lg shadow-brand-blue/25 cursor-pointer"
                >
                  Salvar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
