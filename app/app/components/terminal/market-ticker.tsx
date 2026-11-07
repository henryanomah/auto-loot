'use client';

import React from 'react';
import { AssetSymbol, AssetPrice } from '@/lib/market-engine';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface MarketTickerProps {
  assets: Record<AssetSymbol, AssetPrice>;
  tick: number;
}

export function MarketTicker({ assets, tick }: MarketTickerProps) {
  const assetKeys: AssetSymbol[] = ['WOOD', 'IRON', 'GOLD'];

  const getAccentColor = (symbol: AssetSymbol) => {
    switch (symbol) {
      case 'GOLD':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          text: 'text-amber-400',
          glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          svgStroke: '#f59e0b',
        };
      case 'IRON':
        return {
          border: 'border-cyan-500/30 hover:border-cyan-500/60',
          text: 'text-cyan-400',
          glow: 'shadow-[0_0_15px_-3px_rgba(6,182,212,0.25)]',
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          svgStroke: '#06b6d4',
        };
      case 'WOOD':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          text: 'text-emerald-400',
          glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          svgStroke: '#10b981',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {assetKeys.map((symbol) => {
        const item = assets?.[symbol];
        if (!item) return null;

        // Defensive normalization to prevent any undefined toFixed errors
        const priceVal = typeof item === 'object' && typeof item.price === 'number' ? item.price : typeof item === 'number' ? item : 0;
        const change24hVal = typeof item === 'object' && typeof item.change24h === 'number' ? item.change24h : 0;
        const highVal = typeof item === 'object' && typeof item.high24h === 'number' ? item.high24h : priceVal;
        const lowVal = typeof item === 'object' && typeof item.low24h === 'number' ? item.low24h : priceVal;
        const nameVal = typeof item === 'object' && item.name ? item.name : symbol;
        const isPositive = change24hVal >= 0;

        const style = getAccentColor(symbol);

        // Render SVG sparkline safely
        const history = (typeof item === 'object' && Array.isArray(item.history) && item.history.length > 0)
          ? item.history
          : [priceVal, priceVal];
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min || 1;
        const width = 120;
        const height = 36;
        const points = history
          .map((val, idx) => {
            const x = (idx / (history.length - 1 || 1)) * width;
            const y = height - ((val - min) / range) * (height - 8) - 4;
            return `${x},${y}`;
          })
          .join(' ');

        return (
          <div
            key={symbol}
            className={`relative bg-[#050811]/90 border ${style.border} ${style.glow} p-4 transition-all duration-300 backdrop-blur-md group`}
          >
            {/* Top row: Name & Badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 border font-mono font-bold tracking-wider ${style.badge}`}>
                  ${symbol}
                </span>
                <span className="text-xs text-zinc-400 tracking-wide font-sans">{nameVal}</span>
              </div>
              <div
                className={`flex items-center text-xs font-mono font-semibold ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <ArrowUpRight className="size-3.5 mr-0.5" /> : <ArrowDownRight className="size-3.5 mr-0.5" />}
                {isPositive ? '+' : ''}
                {change24hVal}%
              </div>
            </div>

            {/* Price & Sparkline */}
            <div className="flex items-end justify-between mt-3">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Market Price</div>
                <div className={`text-2xl font-black font-mono tracking-tight ${style.text}`}>
                  {priceVal.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-zinc-500">CR</span>
                </div>
              </div>

              {/* Sparkline chart */}
              <div className="w-[120px] h-[36px] overflow-hidden">
                <svg width={width} height={height} className="overflow-visible">
                  <polyline
                    fill="none"
                    stroke={style.svgStroke}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Row: 24h High/Low */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500">
              <span>H: {highVal.toFixed(2)}</span>
              <span>L: {lowVal.toFixed(2)}</span>
              <span className="flex items-center gap-1 text-zinc-400">
                <Activity className="size-2.5 text-cyan-400 animate-pulse" />
                TICK #{tick}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
