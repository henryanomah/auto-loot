'use client';

import React, { useState } from 'react';
import { AssetSymbol, MarketState } from '@/lib/market-engine';
import { Zap, TrendingDown, RefreshCw, Radio } from 'lucide-react';

interface MarketChartProps {
  market: MarketState;
  onTriggerShock: (asset: AssetSymbol, direction: 'UP' | 'DOWN') => Promise<void>;
  isLoadingShock: boolean;
}

export function MarketChart({ market, onTriggerShock, isLoadingShock }: MarketChartProps) {
  const [activeAsset, setActiveAsset] = useState<AssetSymbol>('GOLD');

  const selectedAsset = market.assets[activeAsset];
  const history = selectedAsset?.history || [];
  const minPrice = Math.min(...history);
  const maxPrice = Math.max(...history);
  const priceRange = maxPrice - minPrice || 1;

  // Chart dimensions
  const chartHeight = 160;
  const chartWidth = 500;

  // Generate SVG path for the area fill and line
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 30) - 15;
    return { x, y, val };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${polylinePoints} ${chartWidth},${chartHeight} 0,${chartHeight}`;

  const getTheme = (symbol: AssetSymbol) => {
    switch (symbol) {
      case 'GOLD':
        return { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.12)', text: 'text-amber-400' };
      case 'IRON':
        return { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.12)', text: 'text-cyan-400' };
      case 'WOOD':
        return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)', text: 'text-emerald-400' };
    }
  };

  const theme = getTheme(activeAsset);

  return (
    <div className="bg-[#050811]/90 border border-zinc-800 p-5 shadow-[0_0_30px_-10px_rgba(0,243,255,0.1)] backdrop-blur-md">
      {/* Header with Title and Asset Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Radio className="size-3 animate-pulse text-cyan-400" />
            LIVE TELEMETRY FEED
          </div>
          <span className="text-xs text-zinc-400 font-mono">TICK #{market.tick} // REFRESH: 5.0s</span>
        </div>

        {/* Asset Selection Buttons */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 border border-zinc-800">
          {(['GOLD', 'IRON', 'WOOD'] as AssetSymbol[]).map((sym) => (
            <button
              key={sym}
              onClick={() => setActiveAsset(sym)}
              className={`px-3 py-1 text-xs font-mono font-bold transition-all ${
                activeAsset === sym
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              ${sym}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative mt-4">
        {/* Price Telemetry Overlay */}
        <div className="absolute top-2 left-2 z-10 font-mono pointer-events-none">
          <div className="text-xs text-zinc-500 uppercase tracking-widest">{selectedAsset?.name}</div>
          <div className={`text-2xl font-black ${theme.text}`}>
            {selectedAsset?.price.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-400">CREDITS</span>
          </div>
        </div>

        {/* SVG Telemetry Chart */}
        <div className="w-full h-[180px] overflow-hidden pt-4">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id={`grad-${activeAsset}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.stroke} stopOpacity="0.25" />
                <stop offset="100%" stopColor={theme.stroke} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#1f2937"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Area Fill */}
            <polygon fill={`url(#grad-${activeAsset})`} points={areaPoints} />

            {/* Price Polyline */}
            <polyline
              fill="none"
              stroke={theme.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />

            {/* Pulse circle on the current point */}
            {points.length > 0 && (
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="4.5"
                fill={theme.stroke}
                className="animate-ping"
              />
            )}
            {points.length > 0 && (
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="3.5"
                fill="#ffffff"
                stroke={theme.stroke}
                strokeWidth="2"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Derived Cross Rates Matrix */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80">
        <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
          Real-time Cross-Exchange Matrix
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2">
            <div className="text-zinc-500 text-[10px]">1 GOLD COSTS</div>
            <div className="text-amber-400 font-bold mt-0.5">{market.crossRates.IRON_PER_GOLD} $IRON</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2">
            <div className="text-zinc-500 text-[10px]">1 IRON COSTS</div>
            <div className="text-cyan-400 font-bold mt-0.5">{market.crossRates.WOOD_PER_IRON} $WOOD</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2">
            <div className="text-zinc-500 text-[10px]">1 GOLD COSTS</div>
            <div className="text-emerald-400 font-bold mt-0.5">{market.crossRates.WOOD_PER_GOLD} $WOOD</div>
          </div>
        </div>
      </div>

      {/* Volatility Simulation Controls */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
          <Zap className="size-3.5 text-amber-400" />
          <span>MARKET VOLATILITY CONTROLS:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={isLoadingShock}
            onClick={() => onTriggerShock('GOLD', 'UP')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition-all"
          >
            <Zap className="size-3" />
            +12% Bull Shift $GOLD
          </button>
          <button
            disabled={isLoadingShock}
            onClick={() => onTriggerShock('GOLD', 'DOWN')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold bg-rose-500/10 border border-rose-500/40 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
          >
            <TrendingDown className="size-3" />
            -12% Bear Shift $GOLD
          </button>
          <button
            disabled={isLoadingShock}
            onClick={() => onTriggerShock('IRON', 'DOWN')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`size-3 ${isLoadingShock ? 'animate-spin' : ''}`} />
            -12% Bear Shift $IRON
          </button>
        </div>
      </div>
    </div>
  );
}
