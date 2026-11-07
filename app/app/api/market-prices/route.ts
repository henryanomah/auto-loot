import { NextRequest, NextResponse } from 'next/server';
import { evolveMarketPrices, getCurrentMarketPrices, AssetSymbol } from '@/lib/market-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const peek = searchParams.get('peek') === 'true';

    // If peek=true, return snapshot without ticking. Otherwise, evolve prices slightly.
    const marketState = peek ? getCurrentMarketPrices() : evolveMarketPrices();

    return NextResponse.json({
      success: true,
      data: marketState,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch market prices',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { asset, direction } = body as {
      asset?: AssetSymbol;
      direction?: 'UP' | 'DOWN';
    };

    let marketState;
    if (asset && direction) {
      marketState = evolveMarketPrices({ asset, direction });
    } else {
      marketState = evolveMarketPrices();
    }

    return NextResponse.json({
      success: true,
      message: 'Market price updated',
      data: marketState,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to trigger market price evolution',
      },
      { status: 500 }
    );
  }
}
