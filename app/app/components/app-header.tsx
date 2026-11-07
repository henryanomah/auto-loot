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
          </div>
          <p className="text-[11px] font-mono text-zinc-400 hidden sm:block">
            Autonomous In-Game Economy
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <WalletButton />
      </div>
    </header>
  );
}
