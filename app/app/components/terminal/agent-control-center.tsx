'use client';

import React, { useState } from 'react';
import { Terminal, Play, Pause, Send, Sparkles } from 'lucide-react';

interface AgentControlCenterProps {
  onSubmitStrategy: (strategy: string, singleShot?: boolean) => Promise<void>;
  isEvaluating: boolean;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  currentStrategy: string;
}

export function AgentControlCenter({
  onSubmitStrategy,
  isEvaluating,
  isMonitoring,
  onToggleMonitoring,
  currentStrategy,
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
    <div className="bg-[#050811]/90 border border-cyan-500/30 p-5 shadow-[0_0_30px_-10px_rgba(0,243,255,0.15)] backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            AGENT DIRECTIVE CONTROL CENTER
          </h2>
        </div>

        {/* Status Mode Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMonitoring}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold transition-all ${
              isMonitoring
                ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isMonitoring ? (
              <>
                <Pause className="size-3 text-emerald-400" />
                <span>AUTONOMOUS LOOP: ACTIVE</span>
              </>
            ) : (
              <>
                <Play className="size-3 text-zinc-400" />
                <span>START AUTONOMOUS LOOP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Directive Presets */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-2">
          <Sparkles className="size-3 text-cyan-400" />
          <span>QUICK STRATEGY DIRECTIVES (CLICK TO LOAD):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStrategyInput(p.command)}
              className="px-2.5 py-1 text-xs font-mono bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/50 hover:text-cyan-300 text-zinc-400 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Form Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative flex items-center bg-black/60 border border-cyan-500/40 p-2 shadow-inner focus-within:border-cyan-400 transition-colors">
          <span className="text-cyan-400 font-mono text-sm px-2 select-none font-bold">
            AUTOLOOT-PRIME &gt;
          </span>
          <input
            type="text"
            value={strategyInput}
            onChange={(e) => setStrategyInput(e.target.value)}
            placeholder="Type natural-language directive (e.g. 'Trade Iron for Gold if Gold < 10 Iron')..."
            className="w-full bg-transparent border-none outline-none font-mono text-sm text-cyan-100 placeholder:text-zinc-600 focus:ring-0"
          />
          <button
            type="submit"
            disabled={isEvaluating || !strategyInput.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 ml-2 font-mono text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(0,243,255,0.4)]"
          >
            <Send className="size-3" />
            {isEvaluating ? 'EVALUATING...' : 'DISPATCH'}
          </button>
        </div>
      </form>

      {/* Operational Protocol Note */}
      <div className="mt-3 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
        <span>Autonomous Decision Core: Active</span>
        <span>Settlement Layer: Solana DevNet // Atomic SPL</span>
      </div>
    </div>
  );
}
