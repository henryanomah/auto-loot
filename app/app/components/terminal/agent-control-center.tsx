'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Pause,
  Send,
  Sparkles,
  AlertOctagon,
  ShieldAlert,
  Lock,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { FailsafeConfig } from '@/lib/failsafe-engine';

interface AgentControlCenterProps {
  onSubmitStrategy: (strategy: string, singleShot?: boolean) => Promise<void>;
  isEvaluating: boolean;
  isMonitoring: boolean;
  isConnected?: boolean;
  onToggleMonitoring: (input?: string) => void;
  onEmergencyHalt: () => void;
  currentStrategy: string;
  failsafeConfig: FailsafeConfig;
  onUpdateFailsafeConfig: (config: Partial<FailsafeConfig>) => void;
}

export function AgentControlCenter({
  onSubmitStrategy,
  isEvaluating,
  isMonitoring,
  isConnected = false,
  onToggleMonitoring,
  onEmergencyHalt,
  currentStrategy,
  failsafeConfig,
  onUpdateFailsafeConfig,
}: AgentControlCenterProps) {
  const [strategyInput, setStrategyInput] = useState(
    currentStrategy || 'Trade 30 Iron for Gold if Gold drops below 10.0 Iron'
  );

  const presets = [
    {
      label: 'Buy Gold when Cheap',
      command: 'Trade 30 Iron for Gold if Gold drops below 10.0 Iron',
    },
    {
      label: 'Convert Wood to Iron',
      command: 'Sell 50 Wood for Iron if Iron drops below 3.0 Wood',
    },
    {
      label: 'Aggressive Gold Accumulator',
      command: 'Trade 25 Iron for Gold if Gold drops below 12.0 Iron',
    },
  ];

  const handleTriggerWalletConnect = () => {
    const trigger = document.getElementById('solana-wallet-connect-trigger');
    if (trigger) {
      trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
      trigger.click();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      handleTriggerWalletConnect();
      return;
    }
    if (!strategyInput.trim() || isEvaluating) return;
    onSubmitStrategy(strategyInput, !isMonitoring);
  };

  return (
    <div className="bg-[#050811]/90 border border-cyan-500/30 p-5 shadow-[0_0_30px_-10px_rgba(0,243,255,0.15)] backdrop-blur-md font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wider text-white">
            AGENT DIRECTIVE CONTROL CENTER
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Emergency Circuit Breaker (Visible when active) */}
          {isMonitoring && (
            <button
              onClick={onEmergencyHalt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-500/20 border border-rose-500/60 text-rose-300 hover:bg-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
              title="Instantly stop all autonomous loops"
            >
              <AlertOctagon className="size-3 text-rose-400" />
              <span>EMERGENCY HALT</span>
            </button>
          )}

          {/* Autonomous Monitoring Loop Toggle with Interactive Hover Tooltip */}
          <div className="relative group">
            <button
              onClick={!isConnected ? handleTriggerWalletConnect : () => onToggleMonitoring(strategyInput)}
              title={
                !isConnected
                  ? 'Connect your Solana wallet to start autonomous monitoring'
                  : isMonitoring
                  ? 'Pause autonomous protocol'
                  : 'Start autonomous protocol loop'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                !isConnected
                  ? 'bg-zinc-900/80 border border-zinc-800 text-zinc-500 hover:border-cyan-500/50 hover:text-cyan-300 shadow-sm'
                  : isMonitoring
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="size-3 text-emerald-400" />
                  <span>PROTOCOL: ACTIVE</span>
                </>
              ) : !isConnected ? (
                <>
                  <Lock className="size-3 text-cyan-400" />
                  <span>AUTOLOOT (CONNECT WALLET)</span>
                </>
              ) : (
                <>
                  <Play className="size-3 text-zinc-400" />
                  <span>START AUTOLOOT</span>
                </>
              )}
            </button>

            {/* Hover Tooltip when Disconnected */}
            {!isConnected && (
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex z-50 w-64 flex-col gap-1 p-2.5 bg-[#060b18] border border-cyan-500/50 shadow-[0_0_20px_rgba(0,243,255,0.25)] text-[11px] text-zinc-200 font-mono pointer-events-none">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Lock className="size-3" />
                  <span>AUTONOMOUS PROTOCOL LOCKED</span>
                </div>
                <span className="text-zinc-400">
                  Connect your Solana wallet in the top-right header to activate automated tick monitoring. Click to connect.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Guidance Banner When Wallet Disconnected */}
      {!isConnected && (
        <div className="mt-3.5 p-3 bg-cyan-950/25 border border-cyan-500/40 shadow-[0_0_15px_-5px_rgba(0,243,255,0.2)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="size-7 bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
              <Wallet className="size-3.5 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <span>SOLANA DEVNET WALLET REQUIRED</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono tracking-wider">
                  STEP 1
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Connect Phantom or Solflare (top-right header or click below) to unlock strategy directives and autonomous execution.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTriggerWalletConnect}
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,243,255,0.3)] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>CONNECT WALLET</span>
            <ArrowRight className="size-3" />
          </button>
        </div>
      )}

      {/* Directive Presets */}
      <div className="relative group mt-4">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-bold">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-cyan-400" />
            <span>STRATEGY DIRECTIVE PRESETS:</span>
          </div>
          {!isConnected && (
            <span className="text-[10px] text-zinc-500 font-normal">
              Hover to inspect &bull; Connect wallet to dispatch
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!isConnected) {
                  handleTriggerWalletConnect();
                  return;
                }
                setStrategyInput(p.command);
              }}
              title={!isConnected ? 'Connect your Solana wallet to dispatch presets' : `Load: ${p.command}`}
              className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                !isConnected
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-300'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-cyan-500/50 hover:text-cyan-300 text-zinc-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Hover Tooltip when Disconnected */}
        {!isConnected && (
          <div className="absolute left-0 top-full mt-1.5 hidden group-hover:flex z-50 w-72 flex-col gap-1 p-2 bg-[#060b18] border border-cyan-500/50 shadow-[0_0_20px_rgba(0,243,255,0.25)] text-[11px] text-zinc-200 font-mono pointer-events-none">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Lock className="size-3" />
              <span>PRESETS LOCKED</span>
            </span>
            <span className="text-zinc-400">
              Connect your Solana wallet to populate and dispatch automated strategy templates. Click any preset to connect.
            </span>
          </div>
        )}
      </div>

      {/* Risk Management & Emergency Failsafe Rails */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-bold">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-amber-400" />
            <span>EMERGENCY FAILSAFE RAILS:</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-normal">Active Risk Guard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Failsafe 1: Max Drawdown Stop-Loss */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-2 select-none ${!isConnected ? 'cursor-pointer' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={!isConnected}
                  checked={failsafeConfig.stopLossEnabled}
                  onChange={(e) =>
                    onUpdateFailsafeConfig({ stopLossEnabled: e.target.checked })
                  }
                  className="size-3.5 accent-amber-500 rounded-none bg-zinc-800 border-zinc-700 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-zinc-300 font-bold text-[11px]">Stop-Loss Limit</span>
              </label>
              <span
                className={`text-[11px] font-bold ${
                  !isConnected
                    ? 'text-zinc-500'
                    : failsafeConfig.stopLossEnabled ? 'text-amber-400' : 'text-zinc-600'
                }`}
              >
                -{failsafeConfig.maxDrawdownPercent}% Max Drawdown
              </span>
            </div>

            <div className="flex items-center gap-1 mt-2">
              {[5, 10, 15, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  disabled={!isConnected || !failsafeConfig.stopLossEnabled}
                  onClick={() => onUpdateFailsafeConfig({ maxDrawdownPercent: pct })}
                  className={`flex-1 py-0.5 text-[10px] font-bold border transition-colors ${
                    !isConnected
                      ? 'bg-zinc-900/40 border-zinc-900 text-zinc-700 cursor-not-allowed'
                      : failsafeConfig.maxDrawdownPercent === pct && failsafeConfig.stopLossEnabled
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 cursor-pointer'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400 disabled:opacity-40 cursor-pointer'
                  }`}
                >
                  -{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Failsafe 2: Minimum Reserve Floor */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-2 select-none ${!isConnected ? 'cursor-pointer' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={!isConnected}
                  checked={failsafeConfig.reserveFloorEnabled}
                  onChange={(e) =>
                    onUpdateFailsafeConfig({ reserveFloorEnabled: e.target.checked })
                  }
                  className="size-3.5 accent-cyan-500 rounded-none bg-zinc-800 border-zinc-700 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-zinc-300 font-bold text-[11px]">Reserve Floor</span>
              </label>
              <span
                className={`text-[11px] font-bold ${
                  !isConnected
                    ? 'text-zinc-500'
                    : failsafeConfig.reserveFloorEnabled ? 'text-cyan-400' : 'text-zinc-600'
                }`}
              >
                {failsafeConfig.minReserveUnits} Min Units
              </span>
            </div>

            <div className="flex items-center gap-1 mt-2">
              {[5, 10, 20, 50].map((units) => (
                <button
                  key={units}
                  type="button"
                  disabled={!isConnected || !failsafeConfig.reserveFloorEnabled}
                  onClick={() => onUpdateFailsafeConfig({ minReserveUnits: units })}
                  className={`flex-1 py-0.5 text-[10px] font-bold border transition-colors ${
                    !isConnected
                      ? 'bg-zinc-900/40 border-zinc-900 text-zinc-700 cursor-not-allowed'
                      : failsafeConfig.minReserveUnits === units && failsafeConfig.reserveFloorEnabled
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 cursor-pointer'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400 disabled:opacity-40 cursor-pointer'
                  }`}
                >
                  {units} U
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Form Input with Rich Hover Guidance */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative group">
          <div
            className={`flex items-center bg-black/60 border p-2 shadow-inner transition-colors ${
              !isConnected
                ? 'border-zinc-800/80 hover:border-cyan-500/50'
                : 'border-cyan-500/40 focus-within:border-cyan-400'
            }`}
          >
            <span
              className={`text-xs px-2.5 py-1 mr-2 select-none font-bold shrink-0 whitespace-nowrap border-r font-mono ${
                !isConnected
                  ? 'text-zinc-500 bg-zinc-950/40 border-zinc-800'
                  : 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30'
              }`}
            >
              STRATEGY &gt;
            </span>
            <input
              type="text"
              value={strategyInput}
              onChange={(e) => setStrategyInput(e.target.value)}
              readOnly={!isConnected}
              onClick={() => {
                if (!isConnected) handleTriggerWalletConnect();
              }}
              placeholder={
                isConnected
                  ? "Type economic directive (e.g. 'Trade Iron for Gold if Gold < 10 Iron')..."
                  : "Connect your Solana wallet to unlock directive dispatch..."
              }
              className={`w-full bg-transparent border-none outline-none font-mono text-sm focus:ring-0 ${
                !isConnected
                  ? 'text-zinc-400 cursor-pointer placeholder:text-zinc-600'
                  : 'text-cyan-100 placeholder:text-zinc-600'
              }`}
            />
            <button
              type={!isConnected ? 'button' : 'submit'}
              onClick={!isConnected ? handleTriggerWalletConnect : undefined}
              disabled={isConnected && (isEvaluating || !strategyInput.trim())}
              className={`flex items-center gap-1.5 px-4 py-1.5 ml-2 text-xs font-bold transition-all cursor-pointer ${
                !isConnected
                  ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_12px_rgba(0,243,255,0.2)]'
                  : 'bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
              }`}
              title={!isConnected ? 'Connect your wallet to dispatch' : 'Dispatch strategy to agent'}
            >
              {!isConnected ? (
                <>
                  <Lock className="size-3 text-cyan-400" />
                  <span className="whitespace-nowrap">CONNECT WALLET</span>
                </>
              ) : isEvaluating ? (
                <>
                  <Send className="size-3" />
                  <span className="whitespace-nowrap">EVALUATING...</span>
                </>
              ) : (
                <>
                  <Send className="size-3" />
                  <span className="whitespace-nowrap">DISPATCH</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Hover Tooltip for Dispatch Bar */}
          {!isConnected && (
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex z-50 w-80 flex-col gap-1 p-2.5 bg-[#060b18] border border-cyan-500/50 shadow-[0_0_25px_rgba(0,243,255,0.25)] text-[11px] text-zinc-200 font-mono pointer-events-none">
              <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Lock className="size-3 text-cyan-400" />
                <span>WALLET CONNECTION REQUIRED</span>
              </div>
              <span className="text-zinc-300">
                Connect your Solana wallet (Phantom or Solflare) in the top-right header to evaluate and broadcast strategies on Solana DevNet. Click to connect now.
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
