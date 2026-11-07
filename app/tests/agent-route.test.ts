import { describe, it, expect, beforeEach } from 'vitest';
import { performAtomicSwap, getInventoryTool, getMarketPricesTool } from '../lib/agent-tools';
import { getPlayerInventory, resetPlayerInventory } from '../lib/player-inventory';
import { evaluateStrategyDeterministic } from '../lib/mastra-agent';

describe('Phase 2: AI Agent & Solana Tools', () => {
  const TEST_WALLET = 'TestPlayerWallet111111111111111111111111111';

  beforeEach(() => {
    resetPlayerInventory(TEST_WALLET);
  });

  it('should initialize and fetch starter inventory', async () => {
    const inventory = getPlayerInventory(TEST_WALLET);
    expect(inventory.IRON).toBe(100);
    expect(inventory.WOOD).toBe(250);
    expect(inventory.GOLD).toBe(15);

    const toolResult = await (getInventoryTool.execute as any)({ walletAddress: TEST_WALLET }, {});
    expect(toolResult.status).toBe('SUCCESS');
    expect(toolResult.balances.IRON).toBe(100);
  });

  it('should execute atomic swap and update balances correctly', () => {
    const swap = performAtomicSwap({
      walletAddress: TEST_WALLET,
      fromAsset: 'IRON',
      toAsset: 'GOLD',
      amountIn: 20,
      reason: 'Strategy target satisfied',
    });

    expect(swap.status).toBe('CONFIRMED');
    expect(swap.txSignature).toBeDefined();
    expect(swap.slot).toBeGreaterThan(284000000);
    expect(swap.amountOut).toBeGreaterThan(0);

    const updated = getPlayerInventory(TEST_WALLET);
    expect(updated.IRON).toBe(80);
    expect(updated.GOLD).toBeGreaterThan(15);
  });

  it('should prevent swap when funds are insufficient', () => {
    const swap = performAtomicSwap({
      walletAddress: TEST_WALLET,
      fromAsset: 'GOLD',
      toAsset: 'IRON',
      amountIn: 9999, // Exceeds 15 gold
      reason: 'Test over-limit',
    });

    expect(swap.status).toBe('INSUFFICIENT_FUNDS');
    expect(swap.error).toContain('Insufficient GOLD balance');
  });

  it('should evaluate strategy and hold position when conditions are not met', async () => {
    const result = await evaluateStrategyDeterministic({
      walletAddress: TEST_WALLET,
      strategy: 'Trade Iron for Gold if Gold drops below 1.0 Iron', // Unrealistic condition
    });

    expect(result.decision).toBe('HOLD');
    expect(result.executed).toBe(false);
    expect(result.thoughtLog).toContain('Holding position');
  });

  it('should evaluate strategy and execute swap when target threshold is satisfied', async () => {
    const result = await evaluateStrategyDeterministic({
      walletAddress: TEST_WALLET,
      strategy: 'Trade my Iron for Gold if Gold drops below 50.0 Iron', // Satisfied condition
    });

    expect(result.decision).toBe('SWAP');
    expect(result.executed).toBe(true);
    expect(result.swapResult?.status).toBe('CONFIRMED');
    expect(result.thoughtLog).toContain('Executing atomic swap');
  });
});
