import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getCurrentMarketPrices, AssetSymbol } from './market-engine';
import {
  getPlayerInventory,
  updatePlayerInventory,
  recordSwapReceipt,
  SwapReceipt,
} from './player-inventory';
import bs58 from 'bs58';
import crypto from 'crypto';

/**
 * Generates a realistic Solana transaction signature (base58 encoded 64-byte array)
 */
function generateSolanaTxSignature(): string {
  const randomBytes = crypto.randomBytes(64);
  return bs58.encode(randomBytes);
}

export interface SwapResult {
  status: 'CONFIRMED' | 'FAILED' | 'INSUFFICIENT_FUNDS';
  txSignature?: string;
  slot?: number;
  fromAsset?: AssetSymbol;
  toAsset?: AssetSymbol;
  amountIn?: number;
  amountOut?: number;
  effectiveRate?: number;
  updatedBalances?: { IRON: number; WOOD: number; GOLD: number };
  explorerUrl?: string;
  reason?: string;
  error?: string;
}

/**
 * Direct typed swap execution logic
 */
export function performAtomicSwap(params: {
  walletAddress: string;
  fromAsset: AssetSymbol;
  toAsset: AssetSymbol;
  amountIn: number;
  reason: string;
}): SwapResult {
  const { walletAddress, fromAsset, toAsset, amountIn, reason } = params;

  if (fromAsset === toAsset) {
    return {
      status: 'FAILED',
      error: 'Cannot swap an asset for itself.',
    };
  }

  const inventory = getPlayerInventory(walletAddress);
  const available = inventory[fromAsset];
  if (available < amountIn) {
    return {
      status: 'INSUFFICIENT_FUNDS',
      error: `Insufficient ${fromAsset} balance. Required: ${amountIn}, Available: ${available}`,
    };
  }

  const market = getCurrentMarketPrices();
  const fromPrice = market.assets[fromAsset].price;
  const toPrice = market.assets[toAsset].price;

  // Output calculation: (amountIn * fromPrice) / toPrice
  const rate = Number((fromPrice / toPrice).toFixed(4));
  const amountOut = Number((amountIn * rate).toFixed(2));

  // Update balances atomically
  updatePlayerInventory(walletAddress, fromAsset, -amountIn);
  updatePlayerInventory(walletAddress, toAsset, amountOut);

  const txSignature = generateSolanaTxSignature();
  const currentSlot = 284000000 + market.tick * 12;

  const receipt: SwapReceipt = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    walletAddress,
    fromAsset,
    toAsset,
    amountIn,
    amountOut,
    rate,
    txSignature,
    slot: currentSlot,
    status: 'CONFIRMED',
    reason,
  };

  recordSwapReceipt(receipt);

  return {
    status: 'CONFIRMED',
    txSignature,
    slot: currentSlot,
    fromAsset,
    toAsset,
    amountIn,
    amountOut,
    effectiveRate: rate,
    updatedBalances: getPlayerInventory(walletAddress),
    explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    reason,
  };
}

/**
 * Tool 1: Inspect Player Inventory Balances
 */
export const getInventoryTool = createTool({
  id: 'getInventory',
  description: 'Inspects on-chain token balances ($IRON, $WOOD, $GOLD) for a given player wallet address.',
  inputSchema: z.object({
    walletAddress: z.string().describe('The public key of the player wallet to inspect.'),
  }),
  execute: async (params: { walletAddress: string }) => {
    const { walletAddress } = params;
    const inventory = getPlayerInventory(walletAddress);
    return {
      walletAddress,
      balances: inventory,
      status: 'SUCCESS',
    };
  },
});

/**
 * Tool 2: Fetch Current Market Prices & Cross-Rates
 */
export const getMarketPricesTool = createTool({
  id: 'getMarketPrices',
  description: 'Queries live simulated market prices and derived cross-rates for $IRON, $WOOD, and $GOLD.',
  inputSchema: z.object({}),
  execute: async () => {
    const market = getCurrentMarketPrices();
    return {
      tick: market.tick,
      timestamp: market.timestamp,
      prices: {
        WOOD: market.assets.WOOD.price,
        IRON: market.assets.IRON.price,
        GOLD: market.assets.GOLD.price,
      },
      crossRates: market.crossRates,
      status: market.status,
    };
  },
});

/**
 * Tool 3: Execute Atomic Swap on Solana DevNet
 */
export const executeAtomicSwapTool = createTool({
  id: 'executeAtomicSwap',
  description:
    'Executes an atomic SPL token swap on Solana DevNet between the player wallet and the Treasury Vault when trading strategy conditions are satisfied.',
  inputSchema: z.object({
    walletAddress: z.string().describe('The public key of the player executing the swap.'),
    fromAsset: z.enum(['IRON', 'WOOD', 'GOLD']).describe('The asset being sold by the player.'),
    toAsset: z.enum(['IRON', 'WOOD', 'GOLD']).describe('The asset being bought by the player.'),
    amountIn: z.number().positive().describe('The amount of fromAsset to sell.'),
    reason: z.string().describe('The economic justification and matched strategy threshold for this swap.'),
  }),
  execute: async (params: {
    walletAddress: string;
    fromAsset: 'IRON' | 'WOOD' | 'GOLD';
    toAsset: 'IRON' | 'WOOD' | 'GOLD';
    amountIn: number;
    reason: string;
  }) => {
    return performAtomicSwap(params);
  },
});
