import { describe, it, expect } from 'vitest';
import {
  evaluateFailsafeLimits,
  DEFAULT_FAILSAFE_CONFIG,
  FailsafeConfig,
} from '../lib/failsafe-engine';
import { InventoryBalance } from '../lib/player-inventory';

describe('Feature B: Emergency Failsafe Triggers & Risk Boundaries Core', () => {
  const inventory: InventoryBalance = {
    WOOD: 50,
    IRON: 15,
    GOLD: 5,
  };

  it('should not trigger failsafe when PnL and inventory are within safe thresholds', () => {
    const result = evaluateFailsafeLimits({
      config: DEFAULT_FAILSAFE_CONFIG,
      currentPnlPercentage: 5.5, // +5.5% profit
      inventory,
      proposedSwap: {
        fromAsset: 'WOOD',
        amountIn: 20, // 50 - 20 = 30 >= 10 min
      },
    });

    expect(result.triggered).toBe(false);
  });

  it('should trigger Stop-Loss when session drawdown breaches max percentage', () => {
    const result = evaluateFailsafeLimits({
      config: {
        ...DEFAULT_FAILSAFE_CONFIG,
        maxDrawdownPercent: 15, // Limit: -15%
      },
      currentPnlPercentage: -16.2, // -16.2% drawdown
    });

    expect(result.triggered).toBe(true);
    expect(result.reason).toBe('STOP_LOSS');
    expect(result.message).toContain('Max drawdown limit breached');
  });

  it('should respect disabled Stop-Loss toggle', () => {
    const result = evaluateFailsafeLimits({
      config: {
        ...DEFAULT_FAILSAFE_CONFIG,
        stopLossEnabled: false,
      },
      currentPnlPercentage: -25.0,
    });

    expect(result.triggered).toBe(false);
  });

  it('should trigger Reserve Floor guard when trade would deplete inventory below floor', () => {
    const result = evaluateFailsafeLimits({
      config: {
        ...DEFAULT_FAILSAFE_CONFIG,
        minReserveUnits: 10,
      },
      currentPnlPercentage: 0,
      inventory,
      proposedSwap: {
        fromAsset: 'IRON', // Currently 15 units
        amountIn: 10,      // 15 - 10 = 5 (< 10 min)
      },
    });

    expect(result.triggered).toBe(true);
    expect(result.reason).toBe('RESERVE_FLOOR');
    expect(result.message).toContain('Reserve floor protected');
  });

  it('should allow trade when remaining inventory equals or exceeds reserve floor', () => {
    const result = evaluateFailsafeLimits({
      config: {
        ...DEFAULT_FAILSAFE_CONFIG,
        minReserveUnits: 10,
      },
      currentPnlPercentage: 0,
      inventory,
      proposedSwap: {
        fromAsset: 'IRON', // Currently 15 units
        amountIn: 5,       // 15 - 5 = 10 (>= 10 min)
      },
    });

    expect(result.triggered).toBe(false);
  });
});
