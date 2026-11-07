'use client';

import React from 'react';
import { SessionPortfolioAnalytics } from '@/lib/session-analytics';
import { Coins, TrendingUp, TrendingDown, Activity, Bot } from 'lucide-react';

interface SessionAnalyticsCardProps {
  analytics: SessionPortfolioAnalytics;
  isMonitoring: boolean;
  currentStrategy: string;
}

export function SessionAnalyticsCard({
  analytics,
  isMonitoring,
  currentStrategy,
}: SessionAnalyticsCardProps) {
  const isPnlPositive = analytics.pnlDelta >= 0;
  const isPnlZero = analytics.pnlDelta === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      {/* Metric 1: Portfolio Net Worth */}
      <div className="bg-[#050811]/90 border border-zinc-800/90 p-4 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 text-xs">
          <span>PORTFOLIO VALUATION</span>
          <Coins className="size-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold tracking-tight text-white">
            {analytics.currentValuation.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-xs text-cyan-400">CR</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            ≈ {analytics.solEquivalent.toFixed(4)} SOL Value
          </div>
        </div>
      </div>

      {/* Metric 2: Session PnL */}
      <div
        className={`bg-[#050811]/90 border p-4 shadow-sm backdrop-blur-md flex flex-col justify-between transition-colors ${
          isPnlZero
            ? 'border-zinc-800/90'
            : isPnlPositive
            ? 'border-emerald-500/30'
            : 'border-rose-500/30'
        }`}
      >
        <div className="flex items-center justify-between text-zinc-500 text-xs">
          <span>SESSION PNL</span>
          {isPnlPositive ? (
            <TrendingUp className="size-4 text-emerald-400" />
          ) : (
            <TrendingDown className="size-4 text-rose-400" />
          )}
        </div>
        <div className="mt-2">
          <div
            className={`text-xl font-bold tracking-tight flex items-center gap-1.5 ${
              isPnlZero
                ? 'text-zinc-300'
                : isPnlPositive
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            <span>
              {isPnlPositive && !isPnlZero ? '+' : ''}
              {analytics.pnlDelta.toFixed(2)}
            </span>
            <span className="text-xs">CR</span>
          </div>
          <div className="text-[11px] mt-0.5 flex items-center gap-1">
            <span
              className={`font-semibold ${
                isPnlZero
                  ? 'text-zinc-500'
                  : isPnlPositive
                  ? 'text-emerald-400/90'
                  : 'text-rose-400/90'
              }`}
            >
              {isPnlPositive && !isPnlZero ? '+' : ''}
              {analytics.pnlPercentage.toFixed(2)}%
            </span>
            <span className="text-zinc-500">since start</span>
          </div>
        </div>
      </div>

      {/* Metric 3: Session Trades */}
      <div className="bg-[#050811]/90 border border-zinc-800/90 p-4 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 text-xs">
          <span>SESSION TRADES</span>
          <Activity className="size-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold tracking-tight text-white">
            {analytics.totalTradesCount}{' '}
            <span className="text-xs text-zinc-500 font-normal">
              {analytics.totalTradesCount === 1 ? 'SWAP' : 'SWAPS'}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {analytics.totalTradesCount > 0 ? '100% Settled On-Chain' : 'Awaiting First Trade'}
          </div>
        </div>
      </div>

      {/* Metric 4: Autonomous Strategy Status */}
      <div className="bg-[#050811]/90 border border-zinc-800/90 p-4 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 text-xs">
          <span>AUTONOMOUS AGENT</span>
          <Bot
            className={`size-4 ${
              isMonitoring ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'
            }`}
          />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                isMonitoring ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span
              className={`text-sm font-bold tracking-wide ${
                isMonitoring ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {isMonitoring ? 'MONITORING TICKS' : 'STANDBY'}
            </span>
          </div>
          <div
            className="text-[11px] text-zinc-500 mt-1 truncate"
            title={currentStrategy}
          >
            {currentStrategy || 'No active directive'}
          </div>
        </div>
      </div>
    </div>
  );
}
