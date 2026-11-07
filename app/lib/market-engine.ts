export type AssetSymbol = 'IRON' | 'WOOD' | 'GOLD';

export interface AssetPrice {
  symbol: AssetSymbol;
  name: string;
  price: number; // Base credit value
  change24h: number; // Percentage change
  high24h: number;
  low24h: number;
  history: number[]; // Last 30 tick prices for sparkline telemetry
}

export interface CrossRates {
  // Gold to others
  GOLD_PER_IRON: number; // How much GOLD 1 IRON buys (e.g. 0.11)
  IRON_PER_GOLD: number; // How much IRON 1 GOLD costs (e.g. 9.10)
  
  // Wood to others
  WOOD_PER_IRON: number; // How much WOOD 1 IRON buys
  IRON_PER_WOOD: number; // How much IRON 1 WOOD costs
  
  // Gold & Wood
  GOLD_PER_WOOD: number; // How much GOLD 1 WOOD buys
  WOOD_PER_GOLD: number; // How much WOOD 1 GOLD costs
}

export interface MarketState {
  tick: number;
  timestamp: string;
  assets: Record<AssetSymbol, AssetPrice>;
  crossRates: CrossRates;
  status: 'STABLE' | 'VOLATILE' | 'SURGE';
}

interface AssetConfig {
  name: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number; // Maximum delta percentage per tick
}

const ASSET_CONFIGS: Record<AssetSymbol, AssetConfig> = {
  WOOD: {
    name: 'Raw Timber',
    basePrice: 2.2,
    minPrice: 1.0,
    maxPrice: 6.0,
    volatility: 0.035, // 3.5%
  },
  IRON: {
    name: 'Refined Iron Ore',
    basePrice: 6.0,
    minPrice: 3.0,
    maxPrice: 15.0,
    volatility: 0.04, // 4.0%
  },
  GOLD: {
    name: 'Pure Gold Bullion',
    basePrice: 58.0,
    minPrice: 30.0,
    maxPrice: 120.0,
    volatility: 0.045, // 4.5%
  },
};

// Generate initial historical seed data
function generateSeedHistory(base: number, volatility: number, count = 25): number[] {
  const points: number[] = [base];
  let current = base;
  for (let i = 1; i < count; i++) {
    const delta = (Math.random() * 2 - 1) * volatility;
    current = Number((current * (1 + delta)).toFixed(2));
    points.push(current);
  }
  return points;
}

// In-memory persistent market state across API requests within this process
let currentTick = 100;
let lastUpdate = Date.now();

const marketAssets: Record<AssetSymbol, AssetPrice> = {
  WOOD: {
    symbol: 'WOOD',
    name: ASSET_CONFIGS.WOOD.name,
    price: 2.25,
    change24h: 1.8,
    high24h: 2.45,
    low24h: 2.05,
    history: generateSeedHistory(2.25, ASSET_CONFIGS.WOOD.volatility),
  },
  IRON: {
    symbol: 'IRON',
    name: ASSET_CONFIGS.IRON.name,
    price: 6.1,
    change24h: -0.6,
    high24h: 6.5,
    low24h: 5.8,
    history: generateSeedHistory(6.1, ASSET_CONFIGS.IRON.volatility),
  },
  GOLD: {
    symbol: 'GOLD',
    name: ASSET_CONFIGS.GOLD.name,
    price: 59.5,
    change24h: 3.4,
    high24h: 62.0,
    low24h: 56.5,
    history: generateSeedHistory(59.5, ASSET_CONFIGS.GOLD.volatility),
  },
};

function calculateCrossRates(prices: Record<AssetSymbol, number>): CrossRates {
  const iron = prices.IRON;
  const wood = prices.WOOD;
  const gold = prices.GOLD;

  return {
    GOLD_PER_IRON: Number((iron / gold).toFixed(4)),
    IRON_PER_GOLD: Number((gold / iron).toFixed(4)),

    WOOD_PER_IRON: Number((iron / wood).toFixed(4)),
    IRON_PER_WOOD: Number((wood / iron).toFixed(4)),

    GOLD_PER_WOOD: Number((wood / gold).toFixed(4)),
    WOOD_PER_GOLD: Number((gold / wood).toFixed(4)),
  };
}

/**
 * Evolves market prices using a bounded random walk with mean-reversion drift
 */
export function evolveMarketPrices(forceSurge?: { asset: AssetSymbol; direction: 'UP' | 'DOWN' }): MarketState {
  currentTick += 1;
  lastUpdate = Date.now();

  const currentPrices: Record<AssetSymbol, number> = {
    WOOD: marketAssets.WOOD.price,
    IRON: marketAssets.IRON.price,
    GOLD: marketAssets.GOLD.price,
  };

  (Object.keys(ASSET_CONFIGS) as AssetSymbol[]).forEach((symbol) => {
    const config = ASSET_CONFIGS[symbol];
    const asset = marketAssets[symbol];

    // Mean-reversion pull factor (slight bias towards baseline)
    const meanPull = (config.basePrice - asset.price) * 0.05;

    // Random market noise (-1 to +1)
    let randomNoise = (Math.random() * 2 - 1) * config.volatility;

    // Handle targeted demo price shocks if requested
    if (forceSurge && forceSurge.asset === symbol) {
      randomNoise = forceSurge.direction === 'UP' ? 0.12 : -0.12;
    }

    const priceChangeMultiplier = 1 + randomNoise + meanPull / asset.price;
    let nextPrice = asset.price * priceChangeMultiplier;

    // Clamp within min/max bounds
    nextPrice = Math.max(config.minPrice, Math.min(config.maxPrice, nextPrice));
    nextPrice = Number(nextPrice.toFixed(2));

    // Update 24h change & high/lows
    const firstSeed = asset.history[0] || config.basePrice;
    asset.change24h = Number((((nextPrice - firstSeed) / firstSeed) * 100).toFixed(2));
    asset.high24h = Math.max(asset.high24h, nextPrice);
    asset.low24h = Math.min(asset.low24h, nextPrice);
    asset.price = nextPrice;

    // Keep sliding window of last 30 tick history
    asset.history.push(nextPrice);
    if (asset.history.length > 30) {
      asset.history.shift();
    }

    currentPrices[symbol] = nextPrice;
  });

  const crossRates = calculateCrossRates(currentPrices);

  return {
    tick: currentTick,
    timestamp: new Date(lastUpdate).toISOString(),
    assets: { ...marketAssets },
    crossRates,
    status: forceSurge ? 'SURGE' : 'STABLE',
  };
}

/**
 * Read current snapshot without incrementing ticks
 */
export function getCurrentMarketPrices(): MarketState {
  const currentPrices: Record<AssetSymbol, number> = {
    WOOD: marketAssets.WOOD.price,
    IRON: marketAssets.IRON.price,
    GOLD: marketAssets.GOLD.price,
  };

  return {
    tick: currentTick,
    timestamp: new Date(lastUpdate).toISOString(),
    assets: { ...marketAssets },
    crossRates: calculateCrossRates(currentPrices),
    status: 'STABLE',
  };
}
