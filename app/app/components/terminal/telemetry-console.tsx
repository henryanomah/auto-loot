'use client';

import React, { useEffect, useRef } from 'react';
import { Trash2, Cpu, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

export interface TelemetryLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

interface TelemetryConsoleProps {
  logs: TelemetryLog[];
  onClearLogs: () => void;
  isAgentActive: boolean;
}

function FormattedMessage({ message }: { message: string }) {
  // Strip raw JSON tool call blocks if model outputs them (e.g. ```json { ... } ```)
  const cleaned = message
    .replace(/```(?:json)?[\s\S]*?```/g, '')
    .trim();

  // Split lines on line breaks
  const rawLines = cleaned.split('\n');
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  return (
    <div className="space-y-1 w-full text-xs">
      {lines.map((line, lIdx) => {
        // Parse **bold** within each line
        const parts = line.split(/(\*\*.*?\*\*)/g);

        return (
          <div key={lIdx} className="leading-relaxed whitespace-pre-wrap">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                return (
                  <strong key={pIdx} className="font-bold text-white font-mono">
                    {boldText}
                  </strong>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export function TelemetryConsole({ logs, onClearLogs, isAgentActive }: TelemetryConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#03060f]/95 border border-zinc-800 p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className={`size-4 ${isAgentActive ? 'text-emerald-400 animate-spin' : 'text-zinc-500'}`} />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            AGENT ACTIVITY STREAM
          </h2>
          {isAgentActive && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
              STREAMING
            </span>
          )}
        </div>

        <button
          onClick={onClearLogs}
          title="Clear Terminal Output"
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Console Scroll Area */}
      <div
        ref={scrollRef}
        className="mt-3 flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 select-text scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic py-8 text-center font-mono">
            No activity recorded. Dispatch a strategy directive to begin.
          </div>
        ) : (
          logs.map((log) => {
            const isSettlement = log.message.includes('SETTLEMENT CONFIRMED') || log.type === 'SUCCESS';
            const isError = log.type === 'ERROR' || log.message.includes('REJECTED');
            const isWarning = log.type === 'WARNING' || log.message.includes('RESERVE GUARD');

            return (
              <div
                key={log.id}
                className={`p-2.5 border transition-all ${
                  isSettlement
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_-4px_rgba(16,185,129,0.3)]'
                    : isError
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                    : 'bg-zinc-950/60 border-zinc-900/90 text-cyan-300 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 text-[10px] text-zinc-500 font-mono">
                  <span className="select-none text-zinc-500">[{log.timestamp}]</span>
                  {isSettlement && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 text-[9px]">
                      <CheckCircle2 className="size-2.5" />
                      SETTLEMENT CONFIRMED
                    </span>
                  )}
                  {isError && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40 text-[9px]">
                      <XCircle className="size-2.5" />
                      BLOCKED / REJECTED
                    </span>
                  )}
                  {isWarning && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 text-[9px]">
                      <AlertTriangle className="size-2.5" />
                      RISK GUARD
                    </span>
                  )}
                </div>
                <FormattedMessage message={log.message} />
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer */}
      <div className="mt-2 pt-2 border-t border-zinc-900 text-[10px] font-mono text-zinc-500 flex items-center justify-between shrink-0">
        <span>Activity Log</span>
        <span>Events: {logs.length}</span>
      </div>
    </div>
  );
}
