import { AssetSymbol } from './market-engine';

export interface InventoryBalance {
  IRON: number;
  WOOD: number;
  GOLD: number;
}

export interface SwapReceipt {
  id: string;
  timestamp: string;
  walletAddress: string;
  fromAsset: AssetSymbol;
  toAsset: AssetSymbol;
  amountIn: number;
  amountOut: number;
  rate: number;
  txSignature: string;
  slot: number;
  status: 'CONFIRMED' | 'FAILED';
  reason?: string;
  isOnChain?: boolean;
}

// In-memory inventory store keyed by wallet public key
const playerInventories = new Map<string, InventoryBalance>();
const swapReceipts: SwapReceipt[] = [];

const DEFAULT_STARTER_INVENTORY: InventoryBalance = {
  WOOD: 250,
  IRON: 100,
  GOLD: 15,
};

export function getPlayerInventory(walletAddress: string): InventoryBalance {
  if (!playerInventories.has(walletAddress)) {
    // Seed new players with starter pack
    playerInventories.set(walletAddress, { ...DEFAULT_STARTER_INVENTORY });
  }
  return { ...playerInventories.get(walletAddress)! };
}

export function updatePlayerInventory(
  walletAddress: string,
  asset: AssetSymbol,
  delta: number
): InventoryBalance {
  const current = getPlayerInventory(walletAddress);
  const nextValue = Math.max(0, Number((current[asset] + delta).toFixed(2)));
  current[asset] = nextValue;
  playerInventories.set(walletAddress, current);
  return { ...current };
}

export function recordSwapReceipt(receipt: SwapReceipt): void {
  swapReceipts.unshift(receipt);
  if (swapReceipts.length > 50) {
    swapReceipts.pop();
  }
}

export function getRecentSwapReceipts(walletAddress?: string): SwapReceipt[] {
  if (!walletAddress) return [...swapReceipts];
  return swapReceipts.filter((r) => r.walletAddress === walletAddress);
}

export function resetPlayerInventory(walletAddress: string): InventoryBalance {
  playerInventories.set(walletAddress, { ...DEFAULT_STARTER_INVENTORY });
  return { ...DEFAULT_STARTER_INVENTORY };
}
