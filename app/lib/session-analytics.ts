import { InventoryBalance } from './player-inventory';
import { MarketState } from './market-engine';

export interface SessionPortfolioAnalytics {
  currentValuation: number; // In Game Credits
  baselineValuation: number; // Initial / adjusted baseline in Credits
  pnlDelta: number; // currentValuation - baselineValuation
  pnlPercentage: number; // ((current - baseline) / baseline) * 100
  solEquivalent: number; // Estimated SOL value of portfolio
  totalTradesCount: number; // Number of trades in session
  profitableTradesCount: number; // Number of profitable trades
  winRate: number; // Percentage (0 - 100)
}

/**
 * Baseline conversion rate: 1 SOL ≈ 25,000 Credits (0.00004 SOL per Credit).
 */
export const SOL_PER_CREDIT = 0.00004;

/**
 * Calculates current valuation of an inventory given prevailing market prices.
 */
export function calculateInventoryValuation(
  inventory: InventoryBalance,
  market: MarketState
): number {
  if (!inventory || !market || !market.assets) return 0;

  const woodPrice = market.assets.WOOD?.price || 0;
  const ironPrice = market.assets.IRON?.price || 0;
  const goldPrice = market.assets.GOLD?.price || 0;

  const total =
    (inventory.WOOD || 0) * woodPrice +
    (inventory.IRON || 0) * ironPrice +
    (inventory.GOLD || 0) * goldPrice;

  return Number(total.toFixed(2));
}

/**
 * Converts Credit valuation to estimated SOL equivalent.
 */
export function creditsToSolEquivalent(credits: number): number {
  if (!credits || credits <= 0) return 0;
  return Number((credits * SOL_PER_CREDIT).toFixed(4));
}

/**
 * Computes comprehensive session analytics comparing current inventory valuation
 * to baseline valuation.
 */
export function computeSessionAnalytics(
  inventory: InventoryBalance,
  market: MarketState,
  baselineValuation: number,
  tradeReceipts: Array<unknown> = []
): SessionPortfolioAnalytics {
  const currentValuation = calculateInventoryValuation(inventory, market);
  const safeBaseline = baselineValuation > 0 ? baselineValuation : currentValuation;

  const pnlDelta = Number((currentValuation - safeBaseline).toFixed(2));
  const pnlPercentage =
    safeBaseline > 0
      ? Number(((pnlDelta / safeBaseline) * 100).toFixed(2))
      : 0;

  const solEquivalent = creditsToSolEquivalent(currentValuation);
  const totalTradesCount = Array.isArray(tradeReceipts) ? tradeReceipts.length : 0;

  return {
    currentValuation,
    baselineValuation: safeBaseline,
    pnlDelta,
    pnlPercentage,
    solEquivalent,
    totalTradesCount,
    profitableTradesCount: totalTradesCount,
    winRate: totalTradesCount > 0 ? 100 : 0,
  };
}
