import { InventoryBalance } from './player-inventory';
import { AssetSymbol } from './market-engine';

export interface FailsafeConfig {
  stopLossEnabled: boolean;
  maxDrawdownPercent: number; // 15 represents a -15% drawdown threshold
  reserveFloorEnabled: boolean;
  minReserveUnits: number; // 10 minimum units to retain per commodity
}

export const DEFAULT_FAILSAFE_CONFIG: FailsafeConfig = {
  stopLossEnabled: true,
  maxDrawdownPercent: 15,
  reserveFloorEnabled: true,
  minReserveUnits: 10,
};

export interface FailsafeEvaluation {
  triggered: boolean;
  reason?: 'STOP_LOSS' | 'RESERVE_FLOOR';
  message?: string;
}

/**
 * Evaluates whether safety risk boundaries have been breached.
 */
export function evaluateFailsafeLimits(params: {
  config: FailsafeConfig;
  currentPnlPercentage: number;
  inventory?: InventoryBalance;
  proposedSwap?: {
    fromAsset: AssetSymbol;
    amountIn: number;
  };
}): FailsafeEvaluation {
  const { config, currentPnlPercentage, inventory, proposedSwap } = params;

  // 1. Check Max Drawdown Stop-Loss
  if (config.stopLossEnabled) {
    const drawdownLimit = -Math.abs(config.maxDrawdownPercent);
    if (currentPnlPercentage <= drawdownLimit) {
      return {
        triggered: true,
        reason: 'STOP_LOSS',
        message: `Max drawdown limit breached (${currentPnlPercentage.toFixed(2)}% <= ${drawdownLimit}%). Autonomous execution halted.`,
      };
    }
  }

  // 2. Check Reserve Floor Guard
  if (config.reserveFloorEnabled && inventory && proposedSwap) {
    const currentBalance = inventory[proposedSwap.fromAsset] || 0;
    const remainingBalance = currentBalance - proposedSwap.amountIn;

    if (remainingBalance < config.minReserveUnits) {
      return {
        triggered: true,
        reason: 'RESERVE_FLOOR',
        message: `Reserve floor protected: Trade of ${proposedSwap.amountIn} $${proposedSwap.fromAsset} would leave ${remainingBalance} units (minimum floor: ${config.minReserveUnits}).`,
      };
    }
  }

  return { triggered: false };
}
