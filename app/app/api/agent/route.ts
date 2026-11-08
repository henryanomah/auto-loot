import { NextRequest, NextResponse } from 'next/server';
import { runAgentStrategy } from '@/lib/mastra-agent';
import {
  getPlayerInventory,
  syncPlayerInventory,
  getRecentSwapReceipts,
  resetPlayerInventory,
  purchaseAssetWithSol,
  updateReceiptOnChain,
  updatePlayerInventory,
  removeSwapReceipt,
} from '@/lib/player-inventory';
import { getCurrentMarketPrices, evolveMarketPrices, AssetSymbol } from '@/lib/market-engine';
import { broadcastOnChainSettlement } from '@/lib/solana-settlement';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const reset = searchParams.get('reset') === 'true';

    // Disconnected / invalid wallet guard: return empty verified state
    if (
      !walletAddress ||
      walletAddress.length < 32 ||
      walletAddress.startsWith('PlayerDefault') ||
      walletAddress === 'default-player' ||
      walletAddress === 'demo-session-wallet'
    ) {
      return NextResponse.json({
        success: true,
        data: {
          walletAddress: '',
          inventory: { WOOD: 250, IRON: 100, GOLD: 15 },
          recentSwaps: [],
          currentMarket: getCurrentMarketPrices(),
          agentStatus: 'DISCONNECTED',
        },
      });
    }

    if (reset) {
      const resetInventory = resetPlayerInventory(walletAddress);
      return NextResponse.json({
        success: true,
        message: 'Inventory reset to starter pack',
        inventory: resetInventory,
      });
    }

    const inventory = getPlayerInventory(walletAddress);
    const receipts = getRecentSwapReceipts(walletAddress);
    const market = getCurrentMarketPrices();

    return NextResponse.json({
      success: true,
      data: {
        walletAddress,
        inventory,
        recentSwaps: receipts,
        currentMarket: market,
        agentStatus: 'READY',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch agent status',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Handle Direct SOL Purchase Action
    if (body.action === 'PURCHASE_WITH_SOL') {
      const { walletAddress, asset, amount, solCost, txSignature } = body as {
        walletAddress: string;
        asset: AssetSymbol;
        amount: number;
        solCost: number;
        txSignature: string;
      };

      const result = purchaseAssetWithSol(
        walletAddress || 'default-player',
        asset,
        amount,
        solCost,
        txSignature
      );

      return NextResponse.json({
        success: true,
        message: `Successfully purchased ${amount} $${asset} with ${solCost} DevNet SOL`,
        data: result,
      });
    }

    const {
      strategy,
      walletAddress,
      groqApiKey,
      evolveMarket,
      failsafeConfig,
      clientInventory,
    } = body as {
      strategy?: string;
      walletAddress?: string;
      groqApiKey?: string;
      evolveMarket?: boolean;
      failsafeConfig?: any;
      clientInventory?: any;
    };

    if (!strategy || typeof strategy !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid trading strategy.',
        },
        { status: 400 }
      );
    }

    const activeWallet = walletAddress;

    // Reject unauthenticated/simulated requests
    if (
      !activeWallet ||
      typeof activeWallet !== 'string' ||
      activeWallet.length < 32 ||
      activeWallet.startsWith('PlayerDefault') ||
      activeWallet === 'default-player' ||
      activeWallet === 'demo-session-wallet'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A connected Solana wallet is required to dispatch autonomous directives. Off-chain simulated trading is strictly disabled.',
        },
        { status: 400 }
      );
    }

    // Synchronize client-provided inventory across serverless lambdas
    if (clientInventory && typeof clientInventory === 'object') {
      syncPlayerInventory(activeWallet, clientInventory);
    }

    // Optionally advance market price tick before evaluating
    const market = evolveMarket ? evolveMarketPrices() : getCurrentMarketPrices();

    // Run the Mastra AI Agent evaluation
    const evaluation = await runAgentStrategy({
      strategy,
      walletAddress: activeWallet,
      groqApiKey,
      failsafeConfig,
    });

    // If trade executed, broadcast on-chain settlement directly to Solana DevNet
    if (evaluation.executed && evaluation.swapResult) {
      const initialSwap = evaluation.swapResult;
      const summary = `-${initialSwap.amountIn} $${initialSwap.fromAsset} -> +${initialSwap.amountOut} $${initialSwap.toAsset} for ${activeWallet.slice(0, 8)}...`;
      try {
        const onChain = await broadcastOnChainSettlement({
          memo: `AutoLoot Settlement: ${summary}`,
          playerWalletAddress: activeWallet,
        });

        if (onChain.isConfirmed && onChain.signature) {
          initialSwap.txSignature = onChain.signature;
          initialSwap.slot = onChain.slot;
          initialSwap.isOnChain = true;
          initialSwap.explorerUrl = `https://explorer.solana.com/tx/${onChain.signature}?cluster=devnet`;
          if (initialSwap.receiptId) {
            updateReceiptOnChain(initialSwap.receiptId, onChain.signature, onChain.slot);
          }
        } else {
          // STRICT REQUIREMENT: ZERO OFF-CHAIN SIMULATION.
          // Roll back optimistic balance updates and purge receipt
          if (initialSwap.receiptId) {
            removeSwapReceipt(initialSwap.receiptId);
          }
          if (initialSwap.fromAsset && initialSwap.toAsset) {
            updatePlayerInventory(activeWallet, initialSwap.fromAsset, initialSwap.amountIn || 0);
            updatePlayerInventory(activeWallet, initialSwap.toAsset, -(initialSwap.amountOut || 0));
          }

          evaluation.executed = false;
          evaluation.decision = 'HOLD';
          evaluation.thoughtLog = `[SETTLEMENT REJECTED] On-chain Solana DevNet transaction unconfirmed (${onChain.broadcastError || 'Transaction rejected by DevNet validator'}). Zero off-chain simulation allowed. Balances preserved.`;
          evaluation.swapResult = undefined;
          evaluation.inventory = getPlayerInventory(activeWallet);
        }
      } catch (err: any) {
        if (initialSwap.receiptId) {
          removeSwapReceipt(initialSwap.receiptId);
        }
        if (initialSwap.fromAsset && initialSwap.toAsset) {
          updatePlayerInventory(activeWallet, initialSwap.fromAsset, initialSwap.amountIn || 0);
          updatePlayerInventory(activeWallet, initialSwap.toAsset, -(initialSwap.amountOut || 0));
        }

        evaluation.executed = false;
        evaluation.decision = 'HOLD';
        evaluation.thoughtLog = `[SETTLEMENT REJECTED] On-chain Solana DevNet transaction error (${err?.message || 'Broadcast error'}). Zero off-chain simulation allowed. Balances preserved.`;
        evaluation.swapResult = undefined;
        evaluation.inventory = getPlayerInventory(activeWallet);
        console.warn('On-chain settlement broadcast failed, trade rolled back:', err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        walletAddress: activeWallet,
        strategy,
        decision: evaluation.decision,
        executed: evaluation.executed,
        thoughtLog: evaluation.thoughtLog,
        swapResult: evaluation.swapResult || null,
        inventory: evaluation.inventory,
        market: {
          tick: market.tick,
          prices: {
            WOOD: market.assets.WOOD.price,
            IRON: market.assets.IRON.price,
            GOLD: market.assets.GOLD.price,
          },
          crossRates: market.crossRates,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error executing agent evaluation.',
      },
      { status: 500 }
    );
  }
}
