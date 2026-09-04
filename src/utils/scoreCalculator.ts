import type { 
  Transaction, 
  MonthlySummary, 
  EmergencyFundConfig, 
  CreditCard, 
  RecurringBill, 
  FinancialHealthScore 
} from '../types/finance';

interface ScoreInput {
  transactions: Transaction[];
  monthlySummary: MonthlySummary;
  emergencyFund: EmergencyFundConfig;
  creditCards: CreditCard[];
  recurringBills: RecurringBill[];
  monthlyIncomeEstimate?: number;
}

const ESSENTIAL_CATEGORIES = [
  'moradia',
  'alimentacao',
  'transporte',
  'saude',
  'educacao',
  'Alimentação & Supermercado',
  'Moradia & Aluguel',
  'Transporte & Combustível',
  'Saúde & Farmácia',
  'Educação & Cursos',
];

export function calculateFinancialScore({
  transactions,
  monthlySummary,
  emergencyFund,
  creditCards,
  recurringBills,
  monthlyIncomeEstimate = 0,
}: ScoreInput): FinancialHealthScore {
  const effectiveIncome = Math.max(monthlySummary.totalIncome, monthlyIncomeEstimate, 1);
  const totalExpense = monthlySummary.totalExpense;
  const balance = effectiveIncome - totalExpense;
  const savingsRate = effectiveIncome > 0 ? (balance / effectiveIncome) * 100 : 0;

  // 1. Pilar de Poupança & Sobra (Max 300 pts)
  let savingsScore = 50;
  let savingsStatus: 'good' | 'warning' | 'critical' = 'warning';
  let savingsDesc = 'Poupança moderada.';
  let savingsTip = 'Procure poupar pelo menos 20% da sua renda todo mês.';

  if (savingsRate >= 25) {
    savingsScore = 300;
    savingsStatus = 'good';
    savingsDesc = `Excelente! Você está retendo ${savingsRate.toFixed(1)}% dos seus ganhos.`;
    savingsTip = 'Continue aportando consistentemente para acelerar seu patrimônio.';
  } else if (savingsRate >= 15) {
    savingsScore = 230;
    savingsStatus = 'good';
    savingsDesc = `Muito bom! Taxa de poupança em ${savingsRate.toFixed(1)}%.`;
    savingsTip = 'Tente elevar para 20% cortando pequenos desperdícios diários.';
  } else if (savingsRate >= 5) {
    savingsScore = 150;
    savingsStatus = 'warning';
    savingsDesc = `Sobra modesta de ${savingsRate.toFixed(1)}%.`;
    savingsTip = 'Revise gastos supérfluos para aumentar sua margem de segurança.';
  } else if (savingsRate >= 0) {
    savingsScore = 80;
    savingsStatus = 'warning';
    savingsDesc = 'Orçamento quase no zero a zero.';
    savingsTip = 'Qualquer imprevisto pode gerar endividamento. Busque uma folga de 10%.';
  } else {
    savingsScore = 20;
    savingsStatus = 'critical';
    savingsDesc = `Déficit mensal de R$ ${Math.abs(balance).toFixed(2)}. Gastando mais do que ganha.`;
    savingsTip = 'Prioridade máxima: corte despesas não essenciais imediatamente.';
  }

  // 2. Pilar de Reserva de Emergência (Max 250 pts)
  const monthlyBaseCost = totalExpense > 0 ? totalExpense : effectiveIncome * 0.7;
  const targetReserve = emergencyFund.customTargetAmount && emergencyFund.customTargetAmount > 0
    ? emergencyFund.customTargetAmount
    : (emergencyFund.targetMonths || 6) * monthlyBaseCost;

  const reserveCoverageRatio = targetReserve > 0 ? emergencyFund.currentAmount / targetReserve : 0;
  const monthsCovered = monthlyBaseCost > 0 ? emergencyFund.currentAmount / monthlyBaseCost : 0;

  let emergencyScore = 30;
  let emergencyStatus: 'good' | 'warning' | 'critical' = 'warning';
  let emergencyDesc = 'Reserva em construção inicial.';
  let emergencyTip = 'Construa sua reserva de emergência antes de investimentos de risco.';

  if (reserveCoverageRatio >= 0.95 || monthsCovered >= (emergencyFund.targetMonths || 6)) {
    emergencyScore = 250;
    emergencyStatus = 'good';
    emergencyDesc = `Blindagem total! Cobre ${monthsCovered.toFixed(1)} meses de custos de vida.`;
    emergencyTip = 'Sua base é sólida. Agora você pode investir em ativos de maior rentabilidade.';
  } else if (reserveCoverageRatio >= 0.6 || monthsCovered >= 3) {
    emergencyScore = 190;
    emergencyStatus = 'good';
    emergencyDesc = `Boa proteção (${monthsCovered.toFixed(1)} meses de custos cobertos).`;
    emergencyTip = `Faltam R$ ${Math.max(0, targetReserve - emergencyFund.currentAmount).toFixed(0)} para completar sua meta.`;
  } else if (reserveCoverageRatio >= 0.25 || monthsCovered >= 1.5) {
    emergencyScore = 120;
    emergencyStatus = 'warning';
    emergencyDesc = `Proteção intermediária (${monthsCovered.toFixed(1)} meses cobertos).`;
    emergencyTip = 'Direcione ao menos 50% das sobras mensais para atingir 3 meses de reserva.';
  } else {
    emergencyScore = 40;
    emergencyStatus = 'critical';
    emergencyDesc = 'Sem cobertura financeira segura em caso de emergência.';
    emergencyTip = 'Coloque qualquer valor inicial em um CDB de liquidez diária ou Tesouro Selic.';
  }

  // 3. Pilar de Equilíbrio Orçamentário / Regra 50-30-20 (Max 250 pts)
  let essentialSpending = 0;
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const isEssential = ESSENTIAL_CATEGORIES.some(cat => 
        t.category.toLowerCase().includes(cat.toLowerCase())
      );
      if (isEssential) essentialSpending += t.amount;
    }
  });

  const essentialRatio = effectiveIncome > 0 ? (essentialSpending / effectiveIncome) * 100 : 50;

  let budgetScore = 120;
  let budgetStatus: 'good' | 'warning' | 'critical' = 'warning';
  let budgetDesc = 'Custos fixos dentro do padrão médio.';
  let budgetTip = 'Mantenha os custos essenciais sempre abaixo de 55% da renda.';

  if (essentialRatio <= 50) {
    budgetScore = 250;
    budgetStatus = 'good';
    budgetDesc = `Perfeito! Custos básicos consom apenas ${essentialRatio.toFixed(1)}% da renda (ideal: <= 50%).`;
    budgetTip = 'Você tem alta flexibilidade financeira para projetos e investimentos.';
  } else if (essentialRatio <= 65) {
    budgetScore = 180;
    budgetStatus = 'good';
    budgetDesc = `Custos básicos em ${essentialRatio.toFixed(1)}% da renda.`;
    budgetTip = 'Atenção para não assumir novas contas fixas no médio prazo.';
  } else if (essentialRatio <= 75) {
    budgetScore = 110;
    budgetStatus = 'warning';
    budgetDesc = `Custos essenciais pesados (${essentialRatio.toFixed(1)}% da renda).`;
    budgetTip = 'Tente renegociar contratos (internet, aluguel, tarifas) para desafogar.';
  } else {
    budgetScore = 50;
    budgetStatus = 'critical';
    budgetDesc = `Sobrecarga severa! Custos básicos consom ${essentialRatio.toFixed(1)}% da sua renda.`;
    budgetTip = 'Estrutura de custo insustentável. Necessário reestruturação urgente de contas.';
  }

  // 4. Pilar de Cartões & Comprometimento de Dívidas (Max 200 pts)
  const totalCreditLimit = creditCards.reduce((acc, c) => acc + (c.limit || 0), 0);
  
  let currentCreditSpent = 0;
  transactions.forEach(t => {
    if (t.type === 'expense' && t.paymentMethod === 'credit') {
      currentCreditSpent += t.amount;
    }
  });

  let creditDebtScore = 150;
  let creditDebtStatus: 'good' | 'warning' | 'critical' = 'good';
  let creditDebtDesc = 'Uso consciente dos meios de pagamento.';
  let creditDebtTip = 'Pague sempre 100% da fatura em dia para evitar juros rotativos.';

  if (totalCreditLimit > 0) {
    const limitUsageRatio = (currentCreditSpent / totalCreditLimit) * 100;
    if (limitUsageRatio <= 30) {
      creditDebtScore = 200;
      creditDebtStatus = 'good';
      creditDebtDesc = `Uso ideal do cartão (${limitUsageRatio.toFixed(1)}% do limite).`;
      creditDebtTip = 'Manter o uso abaixo de 30% protege seu score de crédito bancário.';
    } else if (limitUsageRatio <= 50) {
      creditDebtScore = 150;
      creditDebtStatus = 'good';
      creditDebtDesc = `Uso moderado (${limitUsageRatio.toFixed(1)}% do limite).`;
      creditDebtTip = 'Evite novas compras parceladas até que faturas anteriores baixem.';
    } else if (limitUsageRatio <= 75) {
      creditDebtScore = 90;
      creditDebtStatus = 'warning';
      creditDebtDesc = `Atenção: ${limitUsageRatio.toFixed(1)}% do limite de crédito comprometido.`;
      creditDebtTip = 'Priorize amortizar parcelamentos futuros para recuperar fôlego financeiro.';
    } else {
      creditDebtScore = 30;
      creditDebtStatus = 'critical';
      creditDebtDesc = `Alerta: ${limitUsageRatio.toFixed(1)}% do limite de crédito estourando.`;
      creditDebtTip = 'Risco alto de inadimplência. Congele compras parceladas imediatamente.';
    }
  } else {
    // Sem cartões cadastrados, analisa se gastos no crédito são proporcionais à renda
    const creditIncomeRatio = effectiveIncome > 0 ? (currentCreditSpent / effectiveIncome) * 100 : 0;
    if (creditIncomeRatio <= 25) {
      creditDebtScore = 200;
      creditDebtDesc = 'Despesas de cartão sob controle em relação à renda.';
    } else if (creditIncomeRatio <= 45) {
      creditDebtScore = 140;
      creditDebtDesc = 'Gastos no cartão em patamar médio.';
    } else {
      creditDebtScore = 60;
      creditDebtStatus = 'warning';
      creditDebtDesc = 'Cartão consumindo mais de 45% da sua renda mensal.';
    }
  }

  // Pontuação Total
  const totalScore = Math.min(1000, Math.max(0, savingsScore + emergencyScore + budgetScore + creditDebtScore));

  let level: 'Crítico' | 'Regular' | 'Bom' | 'Excelente' = 'Regular';
  let levelColor = '#FFA800';

  if (totalScore >= 850) {
    level = 'Excelente';
    levelColor = '#00D284';
  } else if (totalScore >= 700) {
    level = 'Bom';
    levelColor = '#0066FF';
  } else if (totalScore >= 500) {
    level = 'Regular';
    levelColor = '#FFA800';
  } else {
    level = 'Crítico';
    levelColor = '#FF4D6A';
  }

  // Recomendações dinâmicas priorizadas
  const recommendations: string[] = [];
  if (savingsStatus !== 'good') recommendations.push(savingsTip);
  if (emergencyStatus !== 'good') recommendations.push(emergencyTip);
  if (budgetStatus !== 'good') recommendations.push(budgetTip);
  if (creditDebtStatus !== 'good') recommendations.push(creditDebtTip);

  // Análise de peso de assinaturas e contas fixas
  const totalMonthlyBills = recurringBills.reduce((acc, b) => {
    return acc + (b.frequency === 'yearly' ? b.amount / 12 : b.amount);
  }, 0);
  if (totalMonthlyBills > effectiveIncome * 0.4) {
    recommendations.push(`Suas contas fixas e assinaturas somam R$ ${totalMonthlyBills.toFixed(0)}/mês (> 40% da renda). Audite assinaturas para reduzir custos fixos.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Parabéns! Sua gestão financeira está entre os 5% melhores padrões.');
    recommendations.push('Considere diversificar investimentos em FIIs e renda variável para acelerar juros compostos.');
  }

  return {
    totalScore,
    level,
    levelColor,
    savingsPillar: {
      title: 'Taxa de Poupança & Sobra',
      score: savingsScore,
      maxScore: 300,
      status: savingsStatus,
      description: savingsDesc,
      tip: savingsTip,
    },
    emergencyPillar: {
      title: 'Reserva de Emergência',
      score: emergencyScore,
      maxScore: 250,
      status: emergencyStatus,
      description: emergencyDesc,
      tip: emergencyTip,
    },
    budgetPillar: {
      title: 'Equilíbrio 50-30-20',
      score: budgetScore,
      maxScore: 250,
      status: budgetStatus,
      description: budgetDesc,
      tip: budgetTip,
    },
    creditDebtPillar: {
      title: 'Uso de Cartão & Endividamento',
      score: creditDebtScore,
      maxScore: 200,
      status: creditDebtStatus,
      description: creditDebtDesc,
      tip: creditDebtTip,
    },
    recommendations,
  };
}
