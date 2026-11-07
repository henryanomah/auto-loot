import { NextRequest, NextResponse } from 'next/server';
import { runAgentStrategy } from '@/lib/mastra-agent';
import { getPlayerInventory, getRecentSwapReceipts, resetPlayerInventory } from '@/lib/player-inventory';
import { getCurrentMarketPrices, evolveMarketPrices } from '@/lib/market-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress') || 'default-player';
    const reset = searchParams.get('reset') === 'true';

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
    const { strategy, walletAddress, groqApiKey, evolveMarket } = body as {
      strategy?: string;
      walletAddress?: string;
      groqApiKey?: string;
      evolveMarket?: boolean;
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

    const activeWallet = walletAddress || 'demo-session-wallet';

    // Optionally advance market price tick before evaluating
    const market = evolveMarket ? evolveMarketPrices() : getCurrentMarketPrices();

    // Run the Mastra AI Agent evaluation
    const evaluation = await runAgentStrategy({
      strategy,
      walletAddress: activeWallet,
      groqApiKey,
    });

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
