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
} from 'lucide-react';
import { FailsafeConfig } from '@/lib/failsafe-engine';

interface AgentControlCenterProps {
  onSubmitStrategy: (strategy: string, singleShot?: boolean) => Promise<void>;
  isEvaluating: boolean;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onEmergencyHalt: () => void;
  currentStrategy: string;
  failsafeConfig: FailsafeConfig;
  onUpdateFailsafeConfig: (config: Partial<FailsafeConfig>) => void;
}

export function AgentControlCenter({
  onSubmitStrategy,
  isEvaluating,
  isMonitoring,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

          {/* Autonomous Monitoring Loop Toggle */}
          <button
            onClick={onToggleMonitoring}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              isMonitoring
                ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isMonitoring ? (
              <>
                <Pause className="size-3 text-emerald-400" />
                <span>PROTOCOL: ACTIVE</span>
              </>
            ) : (
              <>
                <Play className="size-3 text-zinc-400" />
                <span>START AUTOLOOT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Directive Presets */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-2 font-bold">
          <Sparkles className="size-3 text-cyan-400" />
          <span>STRATEGY DIRECTIVE PRESETS:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStrategyInput(p.command)}
              className="px-2.5 py-1 text-xs bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/50 hover:text-cyan-300 text-zinc-400 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
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
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={failsafeConfig.stopLossEnabled}
                  onChange={(e) =>
                    onUpdateFailsafeConfig({ stopLossEnabled: e.target.checked })
                  }
                  className="size-3.5 accent-amber-500 rounded-none bg-zinc-800 border-zinc-700 cursor-pointer"
                />
                <span className="text-zinc-300 font-bold text-[11px]">Stop-Loss Limit</span>
              </label>
              <span
                className={`text-[11px] font-bold ${
                  failsafeConfig.stopLossEnabled ? 'text-amber-400' : 'text-zinc-600'
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
                  disabled={!failsafeConfig.stopLossEnabled}
                  onClick={() => onUpdateFailsafeConfig({ maxDrawdownPercent: pct })}
                  className={`flex-1 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                    failsafeConfig.maxDrawdownPercent === pct && failsafeConfig.stopLossEnabled
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400 disabled:opacity-40'
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
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={failsafeConfig.reserveFloorEnabled}
                  onChange={(e) =>
                    onUpdateFailsafeConfig({ reserveFloorEnabled: e.target.checked })
                  }
                  className="size-3.5 accent-cyan-500 rounded-none bg-zinc-800 border-zinc-700 cursor-pointer"
                />
                <span className="text-zinc-300 font-bold text-[11px]">Reserve Floor</span>
              </label>
              <span
                className={`text-[11px] font-bold ${
                  failsafeConfig.reserveFloorEnabled ? 'text-cyan-400' : 'text-zinc-600'
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
                  disabled={!failsafeConfig.reserveFloorEnabled}
                  onClick={() => onUpdateFailsafeConfig({ minReserveUnits: units })}
                  className={`flex-1 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                    failsafeConfig.minReserveUnits === units && failsafeConfig.reserveFloorEnabled
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400 disabled:opacity-40'
                  }`}
                >
                  {units} U
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Form Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative flex items-center bg-black/60 border border-cyan-500/40 p-2 shadow-inner focus-within:border-cyan-400 transition-colors">
          <span className="text-cyan-400 text-xs px-2.5 py-1 mr-2 select-none font-bold shrink-0 whitespace-nowrap bg-cyan-950/40 border-r border-cyan-500/30 font-mono">
            STRATEGY &gt;
          </span>
          <input
            type="text"
            value={strategyInput}
            onChange={(e) => setStrategyInput(e.target.value)}
            placeholder="Type economic directive (e.g. 'Trade Iron for Gold if Gold < 10 Iron')..."
            className="w-full bg-transparent border-none outline-none font-mono text-sm text-cyan-100 placeholder:text-zinc-600 focus:ring-0"
          />
          <button
            type="submit"
            disabled={isEvaluating || !strategyInput.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 ml-2 text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(0,243,255,0.4)] cursor-pointer"
          >
            <Send className="size-3" />
            {isEvaluating ? 'EVALUATING...' : 'DISPATCH'}
          </button>
        </div>
      </form>
    </div>
  );
}
