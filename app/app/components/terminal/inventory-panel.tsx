'use client';

import React, { useState } from 'react';
import { InventoryBalance } from '@/lib/player-inventory';
import { MarketState, AssetSymbol } from '@/lib/market-engine';
import { Wallet, RefreshCw, Copy, Check, ShoppingCart, Coins, ChevronDown, ChevronUp } from 'lucide-react';

interface InventoryPanelProps {
  inventory: InventoryBalance;
  walletAddress: string;
  market: MarketState;
  onResetInventory: () => Promise<void>;
  isResetting: boolean;
  hasUpdatedRecently: boolean;
  onBuyWithSol: (asset: AssetSymbol, amount: number, solCost: number) => Promise<void>;
  isBuying: boolean;
  isWalletConnected: boolean;
}

const SOL_RATES: Record<AssetSymbol, number> = {
  WOOD: 0.00004, // 250 Wood = 0.01 SOL
  IRON: 0.0002,  // 100 Iron = 0.02 SOL
  GOLD: 0.0025,  // 20 Gold = 0.05 SOL
};

export function InventoryPanel({
  inventory,
  walletAddress,
  market,
  onResetInventory,
  isResetting,
  hasUpdatedRecently,
  onBuyWithSol,
  isBuying,
  isWalletConnected,
}: InventoryPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showDepot, setShowDepot] = useState(true);

  // Manual Asset Purchase State
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('IRON');
  const [customAmount, setCustomAmount] = useState<number>(100);

  const truncatedAddress = walletAddress.length > 12
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : walletAddress;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy address:', e);
    }
  };

  const totalValuation =
    inventory.WOOD * (market.assets.WOOD?.price || 0) +
    inventory.IRON * (market.assets.IRON?.price || 0) +
    inventory.GOLD * (market.assets.GOLD?.price || 0);

  const calculatedSolCost = Number(
    (customAmount * SOL_RATES[selectedAsset]).toFixed(4)
  );

  const handleTriggerWalletConnect = () => {
    const trigger = document.getElementById('solana-wallet-connect-trigger');
    if (trigger) {
      trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
      trigger.click();
    }
  };

  const handlePurchase = () => {
    if (!isWalletConnected) {
      handleTriggerWalletConnect();
      return;
    }
    if (customAmount <= 0 || calculatedSolCost <= 0) return;
    onBuyWithSol(selectedAsset, customAmount, calculatedSolCost);
  };

  const quickPresets = [50, 100, 250, 500];

  return (
    <div
      className={`bg-[#050811]/90 border p-5 backdrop-blur-md font-mono transition-all duration-500 ${
        hasUpdatedRecently
          ? 'border-emerald-500 shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)]'
          : 'border-zinc-800 shadow-[0_0_20px_-10px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wider text-white">
            PLAYER INVENTORY
          </h2>
        </div>
      </div>

      {/* Wallet Identity Bar */}
      <div className="mt-3 flex items-center justify-between bg-zinc-900/60 border border-zinc-800 px-3 py-2 text-xs">
        <span className="text-zinc-500">WALLET:</span>
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-bold">{truncatedAddress}</span>
          <button
            onClick={handleCopy}
            title="Copy Public Key"
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Asset Balances Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {/* $WOOD */}
        <div className="bg-zinc-900/80 border border-emerald-500/30 p-3 relative overflow-hidden group">
          <div className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
            $WOOD
          </div>
          <div className="text-xl font-black text-white mt-1">
            {inventory.WOOD.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            ≈ {(inventory.WOOD * (market.assets.WOOD?.price || 0)).toFixed(1)} CR
          </div>
        </div>

        {/* $IRON */}
        <div className="bg-zinc-900/80 border border-cyan-500/30 p-3 relative overflow-hidden group">
          <div className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">
            $IRON
          </div>
          <div className="text-xl font-black text-white mt-1">
            {inventory.IRON.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            ≈ {(inventory.IRON * (market.assets.IRON?.price || 0)).toFixed(1)} CR
          </div>
        </div>

        {/* $GOLD */}
        <div className="bg-zinc-900/80 border border-amber-500/30 p-3 relative overflow-hidden group">
          <div className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">
            $GOLD
          </div>
          <div className="text-xl font-black text-white mt-1">
            {inventory.GOLD.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            ≈ {(inventory.GOLD * (market.assets.GOLD?.price || 0)).toFixed(1)} CR
          </div>
        </div>
      </div>

      {/* Interactive Resource Depot: Buy Assets with SOL */}
      <div className="mt-4 border border-cyan-500/20 bg-zinc-950/80 p-3">
        <button
          onClick={() => setShowDepot(!showDepot)}
          className="flex w-full items-center justify-between text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Coins className="size-3.5 text-amber-400" />
            <span>BUY IN-GAME ASSETS WITH SOL</span>
          </div>
          {showDepot ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {showDepot && (
          <div className="mt-3 space-y-3 pt-2.5 border-t border-zinc-800 text-xs">
            {/* Asset Selection Tabs */}
            <div className="flex items-center gap-1.5">
              {(['WOOD', 'IRON', 'GOLD'] as AssetSymbol[]).map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => setSelectedAsset(asset)}
                  className={`flex-1 py-1 text-xs font-bold transition-all cursor-pointer border ${
                    selectedAsset === asset
                      ? asset === 'GOLD'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : asset === 'IRON'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(0,243,255,0.3)]'
                        : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ${asset}
                </button>
              ))}
            </div>

            {/* Manual Amount Input */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span>Amount to Buy:</span>
                <span className="text-zinc-500">Rate: {SOL_RATES[selectedAsset]} SOL / unit</span>
              </div>
              <div className="flex items-center bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 focus-within:border-cyan-500 transition-colors">
                <input
                  type="number"
                  min="1"
                  max="50000"
                  step="1"
                  value={customAmount || ''}
                  onChange={(e) => setCustomAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Enter quantity..."
                  className="w-full bg-transparent border-none outline-none text-white font-bold text-sm"
                />
                <span className="text-zinc-400 font-bold text-xs select-none ml-2">
                  ${selectedAsset}
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 mr-1 select-none">Quick:</span>
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomAmount(preset)}
                  className={`px-2 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                    customAmount === preset
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomAmount((prev) => prev + 100)}
                className="px-2 py-0.5 text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                +100
              </button>
            </div>

            {/* Cost & Purchase Action */}
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-zinc-400">Total Price:</span>
                <span className="text-amber-400 font-bold text-sm">
                  {calculatedSolCost} SOL
                </span>
              </div>

              <button
                disabled={isBuying || (isWalletConnected && customAmount <= 0)}
                onClick={handlePurchase}
                title={!isWalletConnected ? 'Connect your Solana wallet to purchase with SOL' : undefined}
                className="flex w-full items-center justify-center gap-1.5 py-2 font-bold text-xs bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(0,243,255,0.3)] cursor-pointer"
              >
                <ShoppingCart className="size-3.5" />
                <span>
                  {isBuying
                    ? 'APPROVING PURCHASE...'
                    : !isWalletConnected
                    ? 'CONNECT WALLET TO BUY'
                    : `BUY ${customAmount} $${selectedAsset} (${calculatedSolCost} SOL)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Valuation & Starter Reset */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <div>
          <span className="text-zinc-500">NET WORTH:</span>{' '}
          <span className="text-cyan-400 font-bold">{totalValuation.toFixed(2)} CREDITS</span>
        </div>

        <button
          onClick={onResetInventory}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw className={`size-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Replenish Starter Pack</span>
        </button>
      </div>
    </div>
  );
}
