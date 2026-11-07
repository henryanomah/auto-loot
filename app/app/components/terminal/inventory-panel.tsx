'use client';

import React from 'react';
import { InventoryBalance } from '@/lib/player-inventory';
import { MarketState } from '@/lib/market-engine';
import { Wallet, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';

interface InventoryPanelProps {
  inventory: InventoryBalance;
  walletAddress: string;
  market: MarketState;
  onResetInventory: () => Promise<void>;
  isResetting: boolean;
  hasUpdatedRecently: boolean;
}

export function InventoryPanel({
  inventory,
  walletAddress,
  market,
  onResetInventory,
  isResetting,
  hasUpdatedRecently,
}: InventoryPanelProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedAddress =
    walletAddress.length > 12
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : walletAddress;

  // Calculate total portfolio valuation in credits
  const totalValuation =
    inventory.WOOD * (market.assets.WOOD?.price || 2.2) +
    inventory.IRON * (market.assets.IRON?.price || 6.0) +
    inventory.GOLD * (market.assets.GOLD?.price || 58.0);

  return (
    <div
      className={`bg-[#050811]/90 border p-5 backdrop-blur-md transition-all duration-500 ${
        hasUpdatedRecently
          ? 'border-emerald-500 shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)]'
          : 'border-zinc-800 shadow-[0_0_20px_-10px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            PLAYER INVENTORY // DEVNET
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30">
          <ShieldCheck className="size-3" />
          <span>ON-CHAIN VERIFIED</span>
        </div>
      </div>

      {/* Wallet Identity Bar */}
      <div className="mt-3 flex items-center justify-between bg-zinc-900/60 border border-zinc-800 px-3 py-2 text-xs font-mono">
        <span className="text-zinc-500">SESSION KEY:</span>
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-bold">{truncatedAddress}</span>
          <button
            onClick={handleCopy}
            title="Copy Public Key"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Resource Balance Cards */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {/* $WOOD */}
        <div className="bg-zinc-900/80 border border-emerald-500/30 p-3 relative overflow-hidden group">
          <div className="text-[10px] font-mono text-emerald-400/80 font-bold uppercase tracking-wider">
            $WOOD
          </div>
          <div className="text-xl font-mono font-black text-white mt-1">
            {inventory.WOOD.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
            ≈ {(inventory.WOOD * (market.assets.WOOD?.price || 0)).toFixed(1)} CR
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
        </div>

        {/* $IRON */}
        <div className="bg-zinc-900/80 border border-cyan-500/30 p-3 relative overflow-hidden group">
          <div className="text-[10px] font-mono text-cyan-400/80 font-bold uppercase tracking-wider">
            $IRON
          </div>
          <div className="text-xl font-mono font-black text-white mt-1">
            {inventory.IRON.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
            ≈ {(inventory.IRON * (market.assets.IRON?.price || 0)).toFixed(1)} CR
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors" />
        </div>

        {/* $GOLD */}
        <div className="bg-zinc-900/80 border border-amber-500/30 p-3 relative overflow-hidden group">
          <div className="text-[10px] font-mono text-amber-400/80 font-bold uppercase tracking-wider">
            $GOLD
          </div>
          <div className="text-xl font-mono font-black text-white mt-1">
            {inventory.GOLD.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
            ≈ {(inventory.GOLD * (market.assets.GOLD?.price || 0)).toFixed(1)} CR
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
        </div>
      </div>

      {/* Portfolio Valuation & Faucet Reset */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-zinc-500">EST. NET WORTH:</span>{' '}
          <span className="text-cyan-400 font-bold">{totalValuation.toFixed(2)} CREDITS</span>
        </div>

        <button
          onClick={onResetInventory}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`size-3 ${isResetting ? 'animate-spin' : ''}`} />
          Replenish Starter Pack
        </button>
      </div>
    </div>
  );
}
