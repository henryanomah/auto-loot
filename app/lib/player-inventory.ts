import { AssetSymbol } from './market-engine';
import crypto from 'crypto';

export interface InventoryBalance {
  IRON: number;
  WOOD: number;
  GOLD: number;
}

export interface SwapReceipt {
  id: string;
  timestamp: string;
  walletAddress: string;
  fromAsset: AssetSymbol | 'SOL';
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

export function purchaseAssetWithSol(
  walletAddress: string,
  asset: AssetSymbol,
  amount: number,
  solCost: number,
  txSignature: string
): { receipt: SwapReceipt; inventory: InventoryBalance } {
  updatePlayerInventory(walletAddress, asset, amount);
  const currentSlot = 284000000 + Math.floor(Math.random() * 50000);

  const receipt: SwapReceipt = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    walletAddress,
    fromAsset: 'SOL',
    toAsset: asset,
    amountIn: solCost,
    amountOut: amount,
    rate: Number((amount / solCost).toFixed(2)),
    txSignature,
    slot: currentSlot,
    status: 'CONFIRMED',
    isOnChain: true,
    reason: `Purchased ${amount} $${asset} with ${solCost} DevNet SOL`,
  };

  recordSwapReceipt(receipt);

  return {
    receipt,
    inventory: getPlayerInventory(walletAddress),
  };
}

export function recordSwapReceipt(receipt: SwapReceipt): void {
  swapReceipts.unshift(receipt);
  if (swapReceipts.length > 50) {
    swapReceipts.pop();
  }
}

export function updateReceiptOnChain(receiptId: string, txSignature: string, slot?: number): void {
  const receipt = swapReceipts.find((r) => r.id === receiptId);
  if (receipt) {
    receipt.txSignature = txSignature;
    receipt.isOnChain = true;
    if (slot) receipt.slot = slot;
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
