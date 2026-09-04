import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Award, 
  ShieldCheck, 
  Sparkles, 
  Info, 
  PiggyBank, 
  Wallet, 
  CreditCard,
  ArrowRight
} from 'lucide-react';

export const FinancialScoreView: React.FC<{ onGoToOperacoes?: () => void }> = ({ onGoToOperacoes }) => {
  const { financialScore } = useFinance();

  const {
    totalScore,
    level,
    levelColor,
    savingsPillar,
    emergencyPillar,
    budgetPillar,
    creditDebtPillar,
    recommendations,
  } = financialScore;

  // Circular gauge calculations
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (totalScore / 1000) * circumference;

  const pillars = [
    { ...savingsPillar, icon: PiggyBank, color: '#00D284' },
    { ...emergencyPillar, icon: ShieldCheck, color: '#0066FF' },
    { ...budgetPillar, icon: Wallet, color: '#FFA800' },
    { ...creditDebtPillar, icon: CreditCard, color: '#9B51E0' },
  ];

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Award className="w-5 h-5 text-brand-blue" />
            Score de Saúde Financeira (0 a 1.000)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnóstico inteligente e gamificado baseado nos 4 pilares da gestão financeira moderna
          </p>
        </div>

        {onGoToOperacoes && (
          <button
            onClick={onGoToOperacoes}
            className="flex items-center gap-2 px-4 py-2 bg-[#151926] hover:bg-[#1f2538] text-slate-300 hover:text-white border border-[#202638] text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
          >
            <span>Central de Operações</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-blue" />
          </button>
        )}
      </div>

      {/* Hero Score Showcase Card */}
      <div className="bg-[#11141e] border border-[#1d2232] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow behind gauge */}
        <div 
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: levelColor }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Circular Gauge Display (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
            
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* SVG Gauge */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
                {/* Track */}
                <circle
                  cx="90"
                  cy="90"
                  r="80"
                  stroke="#151926"
                  strokeWidth="14"
                  fill="none"
                />
                {/* Progress */}
                <circle
                  cx="90"
                  cy="90"
                  r="80"
                  stroke={levelColor}
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out drop-shadow-md"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Seu Score</span>
                <span className="text-4xl font-mono font-black text-white tracking-tight">
                  {totalScore}
                </span>
                <span className="text-xs font-mono text-slate-400">de 1.000 pts</span>
              </div>
            </div>

            {/* Level Badge */}
            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-md"
              style={{
                backgroundColor: `${levelColor}15`,
                borderColor: `${levelColor}40`,
                color: levelColor,
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">
                Nível: {level}
              </span>
            </div>

          </div>

          {/* Quick Summary & Diagnosis (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Diagnóstico Geral</span>
              <h3 className="text-xl font-bold text-white mt-1">
                {totalScore >= 850 && 'Finanças de Alto Padrão! Blindagem e consistência comprovadas.'}
                {totalScore >= 700 && totalScore < 850 && 'Excelente controle financeiro com margem para aceleração de patrimônio.'}
                {totalScore >= 500 && totalScore < 700 && 'Saúde financeira estável, mas requer atenção a reservas e gastos do cartão.'}
                {totalScore < 500 && 'Alerta de risco financeiro: despesas e faturas superando a margem de segurança.'}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Seu score é recalculado dinamicamente com base em seus lançamentos mensais, taxa de sobra, cobertura da reserva de emergência e uso consciente dos limites de crédito.
              </p>
            </div>

            {/* Mini pillars summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {pillars.map((p, idx) => (
                <div key={idx} className="bg-[#151926] p-3 rounded-xl border border-[#202638] text-center space-y-1">
                  <span className="text-[10px] text-slate-500 block truncate font-medium">{p.title}</span>
                  <span className="text-sm font-mono font-bold text-white block">
                    {p.score} <span className="text-[10px] text-slate-500 font-normal">/{p.maxScore}</span>
                  </span>
                  <span className={`text-[9px] font-bold block ${
                    p.status === 'good' ? 'text-[#00D284]' : p.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {p.status === 'good' ? '● Ótimo' : p.status === 'warning' ? '● Atenção' : '● Crítico'}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* 4 Detailed Pillars Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-blue" />
          Detalhamento dos 4 Pilares Financeiros
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const percent = Math.min(100, (pillar.score / pillar.maxScore) * 100);

            return (
              <div 
                key={idx}
                className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-5 shadow-xl space-y-3.5"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: `${pillar.color}25`, color: pillar.color, border: `1px solid ${pillar.color}40` }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{pillar.title}</h4>
                      <span className="text-[10px] text-slate-500">Peso no score: {pillar.maxScore} pontos</span>
                    </div>
                  </div>

                  <span className="text-sm font-mono font-bold text-white">
                    {pillar.score} <span className="text-xs text-slate-500 font-normal">/ {pillar.maxScore}</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-[#151926] rounded-full overflow-hidden p-0.5 border border-[#202638]">
                    <div 
                      className="h-full rounded-full transition-all duration-700"
                      style={{ 
                        width: `${percent}%`,
                        backgroundColor: pillar.status === 'good' ? '#00D284' : pillar.status === 'warning' ? '#FFA800' : '#FF4D6A' 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{percent.toFixed(0)}% da pontuação máxima</span>
                    <span className={pillar.status === 'good' ? 'text-[#00D284]' : pillar.status === 'warning' ? 'text-amber-400' : 'text-rose-400'}>
                      {pillar.status === 'good' ? 'Status: Saudável' : pillar.status === 'warning' ? 'Status: Melhorável' : 'Status: Risco'}
                    </span>
                  </div>
                </div>

                {/* Description & Actionable Tip */}
                <div className="space-y-1 text-xs">
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {pillar.description}
                  </p>
                  <div className="p-2.5 bg-[#151926] rounded-xl border border-[#202638] text-[11px] text-slate-400 flex items-start gap-2 mt-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                    <span><strong className="text-white">Dica Prática:</strong> {pillar.tip}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Action Plan / Recommendations Card */}
      <div className="bg-[#11141e] border border-[#1d2232] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b202e]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00D284]" />
              Plano de Ação Personalizado para Subir seu Score
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Passos práticos priorizados para atingir o teto de 1.000 pontos
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {recommendations.map((rec, index) => (
            <div 
              key={index}
              className="p-3.5 bg-[#151926] rounded-xl border border-[#202638] flex items-center justify-between gap-4 text-xs hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-brand-blue/15 text-brand-blue font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-brand-blue/30">
                  {index + 1}
                </div>
                <span className="text-slate-200 font-medium">{rec}</span>
              </div>

              <span className="text-[10px] font-bold text-[#00D284] bg-[#00D284]/10 border border-[#00D284]/20 px-2.5 py-1 rounded-lg shrink-0">
                + Pontos no Score
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
