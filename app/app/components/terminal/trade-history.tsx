'use client';

import React from 'react';
import { SwapReceipt } from '@/lib/player-inventory';
import { ExternalLink, CheckCircle2, History, ShieldCheck } from 'lucide-react';

interface TradeHistoryProps {
  receipts: SwapReceipt[];
}

export function TradeHistory({ receipts }: TradeHistoryProps) {
  return (
    <div className="bg-[#050811]/90 border border-zinc-800 p-5 shadow-[0_0_20px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <History className="size-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wider text-white">
            TRADE SETTLEMENT LEDGER
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            TOTAL TRADES: {receipts.length}
          </span>
        </div>
      </div>

      {/* Table / List */}
      <div className="mt-3 overflow-x-auto">
        {receipts.length === 0 ? (
          <div className="text-zinc-600 text-xs italic py-8 text-center">
            // No trades executed yet. Dispatch an agent strategy above to begin autonomous settlement.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-900 text-[10px] uppercase">
                <th className="pb-2">Time / Slot</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Rate</th>
                <th className="pb-2">Settlement Status</th>
                <th className="pb-2 text-right">Blockchain Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {receipts.map((tx) => {
                const timeString = new Date(tx.timestamp).toLocaleTimeString();
                const isRealOnChain = Boolean(tx.isOnChain && tx.txSignature);
                const truncatedSig = tx.txSignature
                  ? `${tx.txSignature.slice(0, 8)}...${tx.txSignature.slice(-6)}`
                  : 'Pending';

                return (
                  <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 text-zinc-400">
                      <div>{timeString}</div>
                      <div className="text-[10px] text-zinc-600">
                        {isRealOnChain ? `SLOT #${tx.slot}` : `SIMULATED // TICK #${tx.slot ? tx.slot % 1000 : 0}`}
                      </div>
                    </td>
                    <td className="py-2.5 font-bold">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`size-3 shrink-0 ${isRealOnChain ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <span className="text-rose-300">-{tx.amountIn} ${tx.fromAsset}</span>
                        <span className="text-zinc-500">&rarr;</span>
                        <span className="text-emerald-400">+{tx.amountOut} ${tx.toAsset}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-zinc-400">
                      1 ${tx.fromAsset} = {tx.rate} ${tx.toAsset}
                    </td>
                    <td className="py-2.5">
                      {isRealOnChain ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                          <ShieldCheck className="size-2.5" />
                          CONFIRMED ON DEVNET
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold cursor-help"
                          title={tx.broadcastError || 'Settlement processed in autonomous engine; off-chain simulated.'}
                        >
                          <CheckCircle2 className="size-2.5" />
                          SIMULATED (OFF-CHAIN)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {isRealOnChain ? (
                        <a
                          href={`https://explorer.solana.com/tx/${tx.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline transition-colors text-[11px] font-bold"
                          title="View verified on-chain transaction on Solana Explorer (DevNet)"
                        >
                          <span>{truncatedSig}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span
                          className="text-[11px] text-zinc-500 italic cursor-help"
                          title={tx.broadcastError || 'Settlement executed off-chain'}
                        >
                          OFF-CHAIN
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
