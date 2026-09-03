export interface MarketRate {
  name: string;
  value: number;
  variation?: number;
  symbol?: string;
  updatedAt: string;
}

export interface AssetQuote {
  ticker: string;
  name: string;
  price: number;
  change: number; // percentage, e.g. +1.45%
  type: 'stock' | 'fii' | 'crypto' | 'index' | 'currency';
  currency: string;
}

export interface MarketOverview {
  selic: number;
  cdi: number;
  ipca: number;
  poupanca: number; // calculated annual rate based on BACEN rules
  usd: number;
  usdChange: number;
  eur: number;
  eurChange: number;
  btc: number;
  btcChange: number;
  lastUpdated: string;
}

const CACHE_KEY_RATES = 'finflow_market_rates_cache_v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Default fallback indicators in case of network restriction or offline
const DEFAULT_MARKET_OVERVIEW: MarketOverview = {
  selic: 10.50,
  cdi: 10.40,
  ipca: 4.15,
  poupanca: 6.17, // When Selic > 8.5%, 0.5% a month + TR = ~6.17% a.a.
  usd: 5.62,
  usdChange: 0.35,
  eur: 6.18,
  eurChange: -0.12,
  btc: 345800.00,
  btcChange: 2.45,
  lastUpdated: new Date().toISOString(),
};

// Known popular assets fallback data
const POPULAR_ASSETS_FALLBACK: Record<string, Partial<AssetQuote>> = {
  PETR4: { name: 'Petrobras PN', price: 38.45, change: 1.25, type: 'stock' },
  VALE3: { name: 'Vale ON', price: 58.90, change: -0.80, type: 'stock' },
  ITUB4: { name: 'Itaú Unibanco PN', price: 35.60, change: 0.45, type: 'stock' },
  BBAS3: { name: 'Banco do Brasil ON', price: 27.80, change: 1.10, type: 'stock' },
  HGLG11: { name: 'CSHG Logística FII', price: 164.50, change: 0.15, type: 'fii' },
  MXRF11: { name: 'Maxi Renda FII', price: 10.25, change: -0.10, type: 'fii' },
  XPLG11: { name: 'XP Log FII', price: 105.80, change: 0.30, type: 'fii' },
  BOVA11: { name: 'iShares Ibovespa ETF', price: 132.40, change: 0.65, type: 'index' },
  IVVB11: { name: 'iShares S&P 500 ETF', price: 318.00, change: 1.40, type: 'index' },
  BTC: { name: 'Bitcoin BRL', price: 345800.00, change: 2.45, type: 'crypto' },
  ETH: { name: 'Ethereum BRL', price: 14200.00, change: 1.80, type: 'crypto' },
};

/**
 * Calculates compound monthly interest rate from an annual percentage
 * Formula: (1 + annualRate/100)^(1/12) - 1
 */
export const annualToMonthlyRate = (annualPercentage: number): number => {
  if (annualPercentage <= 0) return 0;
  return Math.pow(1 + annualPercentage / 100, 1 / 12) - 1;
};

/**
 * Calculates net yield for an investment considering IR (Imposto de Renda)
 * Tabela regressiva de IR para renda fixa:
 * Até 180 dias: 22.5%
 * 181 a 360 dias: 20%
 * 361 a 720 dias: 17.5%
 * Acima de 720 dias: 15%
 */
export const calculateNetAnnualRate = (grossAnnualRate: number, days = 365, isTaxFree = false): number => {
  if (isTaxFree) return grossAnnualRate;
  let tax = 0.175; // 1 to 2 years default
  if (days <= 180) tax = 0.225;
  else if (days <= 360) tax = 0.20;
  else if (days <= 720) tax = 0.175;
  else tax = 0.15;

  return grossAnnualRate * (1 - tax);
};

export interface YieldComparisonItem {
  id: string;
  name: string;
  category: string;
  annualRateGross: number;
  annualRateNet: number;
  monthlyReturnR$: number;
  oneYearReturnR$: number;
  isTaxFree: boolean;
  benchmarkLabel: string;
}

/**
 * Computes comparative yield projections based on live market rates
 */
export const calculateLiveYieldProjections = (
  principal: number,
  rates: MarketOverview
): YieldComparisonItem[] => {
  if (principal <= 0) return [];

  const cdi = rates.cdi;
  const selic = rates.selic;
  const ipca = rates.ipca;
  const poupanca = rates.poupanca;

  // 1. CDB 100% CDI
  const cdb100Gross = cdi;
  const cdb100Net = calculateNetAnnualRate(cdb100Gross, 365, false);
  const cdb100MonthlyRate = annualToMonthlyRate(cdb100Net);

  // 2. CDB 115% CDI (Bancos digitais / Médio porte)
  const cdb115Gross = cdi * 1.15;
  const cdb115Net = calculateNetAnnualRate(cdb115Gross, 365, false);
  const cdb115MonthlyRate = annualToMonthlyRate(cdb115Net);

  // 3. Tesouro Selic (100% Selic)
  const tesouroGross = selic;
  const tesouroNet = calculateNetAnnualRate(tesouroGross, 365, false);
  const tesouroMonthlyRate = annualToMonthlyRate(tesouroNet);

  // 4. LCI / LCA 90% CDI (Isento de IR)
  const lciGross = cdi * 0.90;
  const lciNet = lciGross; // Tax free
  const lciMonthlyRate = annualToMonthlyRate(lciNet);

  // 5. Tesouro IPCA+ (IPCA + 6.00% a.a.)
  const ipcaSpread = 6.00;
  const ipcaGross = ((1 + ipca / 100) * (1 + ipcaSpread / 100) - 1) * 100;
  const ipcaNet = calculateNetAnnualRate(ipcaGross, 365, false);
  const ipcaMonthlyRate = annualToMonthlyRate(ipcaNet);

  // 6. Poupança (Isenta de IR)
  const poupancaNet = poupanca;
  const poupancaMonthlyRate = annualToMonthlyRate(poupancaNet);

  return [
    {
      id: 'cdb-100',
      name: 'CDB 100% CDI',
      category: 'Renda Fixa',
      annualRateGross: cdb100Gross,
      annualRateNet: cdb100Net,
      monthlyReturnR$: principal * cdb100MonthlyRate,
      oneYearReturnR$: principal * (cdb100Net / 100),
      isTaxFree: false,
      benchmarkLabel: `100% do CDI (${cdi.toFixed(2)}% a.a.)`,
    },
    {
      id: 'cdb-115',
      name: 'CDB 115% CDI',
      category: 'Renda Fixa Premium',
      annualRateGross: cdb115Gross,
      annualRateNet: cdb115Net,
      monthlyReturnR$: principal * cdb115MonthlyRate,
      oneYearReturnR$: principal * (cdb115Net / 100),
      isTaxFree: false,
      benchmarkLabel: `115% do CDI (${(cdi * 1.15).toFixed(2)}% a.a.)`,
    },
    {
      id: 'tesouro-selic',
      name: 'Tesouro Selic',
      category: 'Títulos Públicos',
      annualRateGross: tesouroGross,
      annualRateNet: tesouroNet,
      monthlyReturnR$: principal * tesouroMonthlyRate,
      oneYearReturnR$: principal * (tesouroNet / 100),
      isTaxFree: false,
      benchmarkLabel: `Selic Oficial (${selic.toFixed(2)}% a.a.)`,
    },
    {
      id: 'lci-lca',
      name: 'LCI / LCA 90% CDI',
      category: 'Isento de IR',
      annualRateGross: lciGross,
      annualRateNet: lciNet,
      monthlyReturnR$: principal * lciMonthlyRate,
      oneYearReturnR$: principal * (lciNet / 100),
      isTaxFree: true,
      benchmarkLabel: `90% do CDI (${lciNet.toFixed(2)}% líquido)`,
    },
    {
      id: 'tesouro-ipca',
      name: 'Tesouro IPCA+ 6%',
      category: 'Proteção Inflacionária',
      annualRateGross: ipcaGross,
      annualRateNet: ipcaNet,
      monthlyReturnR$: principal * ipcaMonthlyRate,
      oneYearReturnR$: principal * (ipcaNet / 100),
      isTaxFree: false,
      benchmarkLabel: `IPCA (${ipca.toFixed(2)}%) + 6% a.a.`,
    },
    {
      id: 'poupanca',
      name: 'Poupança Tradicional',
      category: 'Bancária',
      annualRateGross: poupanca,
      annualRateNet: poupancaNet,
      monthlyReturnR$: principal * poupancaMonthlyRate,
      oneYearReturnR$: principal * (poupancaNet / 100),
      isTaxFree: true,
      benchmarkLabel: `Regra Oficial BACEN (${poupanca.toFixed(2)}% a.a.)`,
    },
  ];
};

/**
 * Calculates estimated monthly yield for an asset based on its type and live rates
 */
export const getEstimatedMonthlyYield = (
  principal: number,
  type: string,
  rates: MarketOverview
): number => {
  if (principal <= 0) return 0;

  switch (type) {
    case 'renda_fixa': {
      // Defaults to 100% CDI net
      const netAnnual = calculateNetAnnualRate(rates.cdi, 365, false);
      const monthlyRate = annualToMonthlyRate(netAnnual);
      return principal * monthlyRate;
    }
    case 'reserva': {
      // Defaults to 100% Selic/CDI
      const netAnnual = calculateNetAnnualRate(rates.cdi, 180, false);
      const monthlyRate = annualToMonthlyRate(netAnnual);
      return principal * monthlyRate;
    }
    case 'fiis': {
      // Average Brazilian FII dividend yield ~ 0.85% monthly
      return principal * 0.0085;
    }
    case 'acoes': {
      // Average dividend yield ~ 0.50% monthly
      return principal * 0.0050;
    }
    case 'cripto': {
      // Staking average ~ 0.35% monthly
      return principal * 0.0035;
    }
    default: {
      const netAnnual = calculateNetAnnualRate(rates.cdi, 365, false);
      return principal * annualToMonthlyRate(netAnnual);
    }
  }
};

export const fetchLiveMarketOverview = async (): Promise<MarketOverview> => {
  // Check cached data first
  try {
    const cached = localStorage.getItem(CACHE_KEY_RATES);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - new Date(parsed.lastUpdated).getTime() < CACHE_TTL_MS) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  const result: MarketOverview = { ...DEFAULT_MARKET_OVERVIEW, lastUpdated: new Date().toISOString() };

  // 1. Fetch BrasilAPI for CDI and Selic
  try {
    const res = await fetch('https://brasilapi.com.br/api/taxas/v1', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const selicObj = data.find((t: any) => t.nome === 'Selic');
        const cdiObj = data.find((t: any) => t.nome === 'CDI');
        const ipcaObj = data.find((t: any) => t.nome === 'IPCA');
        if (selicObj?.valor) result.selic = Number(selicObj.valor);
        if (cdiObj?.valor) result.cdi = Number(cdiObj.valor);
        if (ipcaObj?.valor) result.ipca = Number(ipcaObj.valor);
      }
    }
  } catch (e) {
    console.warn('Could not fetch BrasilAPI rates, using fallbacks', e);
  }

  // Calculate Poupança based on official BACEN rule
  if (result.selic > 8.5) {
    result.poupanca = 6.17; // 0.5% a.m. + TR
  } else {
    result.poupanca = Number((result.selic * 0.7).toFixed(2));
  }

  // 2. Fetch AwesomeAPI for USD, EUR, BTC
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL', {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.USDBRL) {
        result.usd = parseFloat(data.USDBRL.bid);
        result.usdChange = parseFloat(data.USDBRL.pctChange);
      }
      if (data.EURBRL) {
        result.eur = parseFloat(data.EURBRL.bid);
        result.eurChange = parseFloat(data.EURBRL.pctChange);
      }
      if (data.BTCBRL) {
        result.btc = parseFloat(data.BTCBRL.bid);
        result.btcChange = parseFloat(data.BTCBRL.pctChange);
      }
    }
  } catch (e) {
    console.warn('Could not fetch AwesomeAPI rates, using fallbacks', e);
  }

  // Cache the updated result
  try {
    localStorage.setItem(CACHE_KEY_RATES, JSON.stringify(result));
  } catch {
    // ignore
  }

  return result;
};

export const fetchAssetQuote = async (ticker: string): Promise<AssetQuote | null> => {
  const cleanTicker = ticker.trim().toUpperCase();
  if (!cleanTicker) return null;

  // Check in Brapi API (open free API for Brazilian B3 tickers)
  try {
    const res = await fetch(`https://brapi.dev/api/quote/${cleanTicker}?token=free`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const result = data?.results?.[0];
      if (result && result.regularMarketPrice) {
        return {
          ticker: cleanTicker,
          name: result.shortName || cleanTicker,
          price: result.regularMarketPrice,
          change: result.regularMarketChangePercent || 0,
          type: cleanTicker.endsWith('11') ? 'fii' : 'stock',
          currency: 'BRL',
        };
      }
    }
  } catch {
    // fallback
  }

  // Fallback to known list
  if (POPULAR_ASSETS_FALLBACK[cleanTicker]) {
    const item = POPULAR_ASSETS_FALLBACK[cleanTicker];
    return {
      ticker: cleanTicker,
      name: item.name || cleanTicker,
      price: item.price || 100,
      change: item.change || 0,
      type: item.type || 'stock',
      currency: 'BRL',
    };
  }

  return null;
};
