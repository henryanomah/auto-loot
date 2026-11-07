import { describe, it, expect } from 'vitest';
import { evolveMarketPrices, getCurrentMarketPrices } from '../lib/market-engine';

describe('Market Engine (Phase 1)', () => {
  it('should initialize with baseline prices and cross rates', () => {
    const market = getCurrentMarketPrices();
    expect(market.assets.IRON).toBeDefined();
    expect(market.assets.WOOD).toBeDefined();
    expect(market.assets.GOLD).toBeDefined();

    expect(market.assets.IRON.price).toBeGreaterThan(0);
    expect(market.assets.WOOD.price).toBeGreaterThan(0);
    expect(market.assets.GOLD.price).toBeGreaterThan(0);

    expect(market.crossRates.IRON_PER_GOLD).toBeGreaterThan(0);
    expect(market.crossRates.GOLD_PER_IRON).toBeGreaterThan(0);
  });

  it('should fluctuate prices and keep history on evolve', () => {
    const initial = getCurrentMarketPrices();
    const evolved = evolveMarketPrices();

    expect(evolved.tick).toBeGreaterThan(initial.tick);
    expect(evolved.assets.GOLD.history.length).toBeGreaterThanOrEqual(25);
  });

  it('should calculate accurate cross rates between assets', () => {
    const market = getCurrentMarketPrices();
    const ironPrice = market.assets.IRON.price;
    const goldPrice = market.assets.GOLD.price;

    const expectedGoldInIron = Number((goldPrice / ironPrice).toFixed(4));
    expect(market.crossRates.IRON_PER_GOLD).toBeCloseTo(expectedGoldInIron, 1);
  });
});
