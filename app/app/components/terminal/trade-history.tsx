'use client';

import React, { useState } from 'react';
import { SwapReceipt } from '@/lib/player-inventory';
import { ExternalLink, CheckCircle2, History, Send, ShieldCheck, ShieldAlert } from 'lucide-react';

interface TradeHistoryProps {
  receipts: SwapReceipt[];
  onCommitOnChain?: (receiptId: string, summary: string) => Promise<void>;
  isWalletConnected: boolean;
}

export function TradeHistory({ receipts, onCommitOnChain, isWalletConnected }: TradeHistoryProps) {
  const [committingId, setCommittingId] = useState<string | null>(null);

  const handleCommit = async (receipt: SwapReceipt) => {
    if (!onCommitOnChain) return;
    setCommittingId(receipt.id);
    try {
      const summary = `-${receipt.amountIn} $${receipt.fromAsset} -> +${receipt.amountOut} $${receipt.toAsset} (Rate: ${receipt.rate})`;
      await onCommitOnChain(receipt.id, summary);
    } finally {
      setCommittingId(null);
    }
  };

  return (
    <div className="bg-[#050811]/90 border border-zinc-800 p-5 shadow-[0_0_20px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <History className="size-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            TRADE SETTLEMENT LEDGER
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500">
            TOTAL TRADES: {receipts.length}
          </span>
        </div>
      </div>

      {/* Table / List */}
      <div className="mt-3 overflow-x-auto">
        {receipts.length === 0 ? (
          <div className="text-zinc-600 text-xs font-mono italic py-8 text-center">
            // No trades executed yet. Dispatch a strategy above to see settlement receipts here.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-900 text-[10px] uppercase">
                <th className="pb-2">Time / Slot</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Rate</th>
                <th className="pb-2">Settlement Type</th>
                <th className="pb-2 text-right">Blockchain Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {receipts.map((tx) => {
                const timeString = new Date(tx.timestamp).toLocaleTimeString();
                const truncatedSig = `${tx.txSignature.slice(0, 8)}...${tx.txSignature.slice(-6)}`;
                const isCommitting = committingId === tx.id;

                return (
                  <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 text-zinc-400">
                      <div>{timeString}</div>
                      <div className="text-[10px] text-zinc-600">SLOT #{tx.slot}</div>
                    </td>
                    <td className="py-2.5 font-bold">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                        <span className="text-rose-300">-{tx.amountIn} ${tx.fromAsset}</span>
                        <span className="text-zinc-500">&rarr;</span>
                        <span className="text-emerald-400">+{tx.amountOut} ${tx.toAsset}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-zinc-400">
                      1 ${tx.fromAsset} = {tx.rate} ${tx.toAsset}
                    </td>
                    <td className="py-2.5">
                      {tx.isOnChain ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                          <ShieldCheck className="size-2.5" />
                          VERIFIED ON DEVNET
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
                          <ShieldAlert className="size-2.5 text-cyan-400" />
                          SESSION RECEIPT
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {tx.isOnChain ? (
                        <a
                          href={`https://explorer.solana.com/tx/${tx.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline transition-colors text-[11px]"
                        >
                          <span>{truncatedSig}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      ) : isWalletConnected ? (
                        <button
                          onClick={() => handleCommit(tx)}
                          disabled={isCommitting}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50 transition-all"
                        >
                          <Send className={`size-2.5 ${isCommitting ? 'animate-spin' : ''}`} />
                          {isCommitting ? 'BROADCASTING...' : 'COMMIT TO DEVNET'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-600 italic">
                          Connect Phantom to broadcast
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
