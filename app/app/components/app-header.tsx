"use client";

import { WalletButton } from "./wallet-button";
import { Bot, Shield } from "lucide-react";

export function AppHeader() {
  return (
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-cyan-500/20 bg-[#03060f]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-none bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.3)]">
          <Bot className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black tracking-wider text-white">
              AUTOLOOT
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              DEVNET
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 hidden sm:block">
            AI-Managed In-Game Economic Protocol
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <Shield className="size-3 text-emerald-400" />
          <span>SOLANA DEVNET</span>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
