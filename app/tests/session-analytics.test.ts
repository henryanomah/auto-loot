import { describe, it, expect } from 'vitest';
import {
  calculateInventoryValuation,
  creditsToSolEquivalent,
  computeSessionAnalytics,
  SOL_PER_CREDIT,
} from '../lib/session-analytics';
import { MarketState } from '../lib/market-engine';
import { InventoryBalance } from '../lib/player-inventory';

describe('Feature A: Session PnL & Net Worth Analytics Core', () => {
  const mockMarket: MarketState = {
    tick: 100,
    timestamp: new Date().toISOString(),
    status: 'STABLE',
    assets: {
      WOOD: {
        symbol: 'WOOD',
        name: 'Raw Timber',
        price: 2.5,
        change24h: 25,
        high24h: 3.0,
        low24h: 2.0,
        history: [2.0, 2.5],
      },
      IRON: {
        symbol: 'IRON',
        name: 'Refined Iron',
        price: 6.0,
        change24h: 0,
        high24h: 7.0,
        low24h: 5.5,
        history: [6.0, 6.0],
      },
      GOLD: {
        symbol: 'GOLD',
        name: 'Pure Gold',
        price: 60.0,
        change24h: 20,
        high24h: 65.0,
        low24h: 50.0,
        history: [50.0, 60.0],
      },
    },
    crossRates: {
      IRON_PER_GOLD: 10.0,
      WOOD_PER_IRON: 2.4,
      WOOD_PER_GOLD: 24.0,
      GOLD_PER_IRON: 0.1,
      IRON_PER_WOOD: 0.4167,
      GOLD_PER_WOOD: 0.0417,
    },
  };

  const mockInventory: InventoryBalance = {
    WOOD: 100, // 100 * 2.5 = 250 CR
    IRON: 50,  // 50 * 6.0 = 300 CR
    GOLD: 10,  // 10 * 60.0 = 600 CR
               // Total = 1,150 CR
  };

  it('should accurately calculate total inventory valuation across all assets', () => {
    const valuation = calculateInventoryValuation(mockInventory, mockMarket);
    expect(valuation).toBe(1150);
  });

  it('should compute SOL equivalent from credit valuation', () => {
    const solVal = creditsToSolEquivalent(1150);
    // 1150 * 0.00004 = 0.046
    expect(solVal).toBe(0.046);
  });

  it('should compute positive PnL when portfolio valuation increases', () => {
    const baseline = 1000;
    const analytics = computeSessionAnalytics(mockInventory, mockMarket, baseline, [
      { id: 1 },
      { id: 2 },
    ]);

    expect(analytics.currentValuation).toBe(1150);
    expect(analytics.baselineValuation).toBe(1000);
    expect(analytics.pnlDelta).toBe(150);
    expect(analytics.pnlPercentage).toBe(15); // +15%
    expect(analytics.totalTradesCount).toBe(2);
    expect(analytics.winRate).toBe(100);
  });

  it('should compute negative PnL when portfolio valuation decreases', () => {
    const baseline = 1300;
    const analytics = computeSessionAnalytics(mockInventory, mockMarket, baseline, []);

    expect(analytics.currentValuation).toBe(1150);
    expect(analytics.baselineValuation).toBe(1300);
    expect(analytics.pnlDelta).toBe(-150);
    expect(analytics.pnlPercentage).toBeCloseTo(-11.54, 1);
    expect(analytics.totalTradesCount).toBe(0);
  });

  it('should handle zero baseline safely without division by zero', () => {
    const analytics = computeSessionAnalytics(mockInventory, mockMarket, 0);
    expect(analytics.baselineValuation).toBe(1150);
    expect(analytics.pnlDelta).toBe(0);
    expect(analytics.pnlPercentage).toBe(0);
  });
});
