"use client";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 font-mono">
      <div className="border border-cyan-500/30 bg-[#050811]/90 p-8 shadow-[0_0_50px_-12px_rgba(0,243,255,0.2)]">
        <div className="flex items-center gap-3">
          <div className="size-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_#00f3ff]" />
          <h1 className="text-2xl font-black tracking-wider text-cyan-400">
            AUTOLOOT // AI IN-GAME ECONOMIST
          </h1>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Autonomous Solana DevNet inventory optimization protocol online. Ready for agent deployment.
        </p>
      </div>
    </main>
  );
}