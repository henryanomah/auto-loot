'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Trash2, Cpu } from 'lucide-react';

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

export function TelemetryConsole({ logs, onClearLogs, isAgentActive }: TelemetryConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeStyle = (type: TelemetryLog['type']) => {
    switch (type) {
      case 'SUCCESS':
        return 'text-emerald-400';
      case 'WARNING':
        return 'text-amber-400';
      case 'ERROR':
        return 'text-rose-400';
      default:
        return 'text-cyan-300';
    }
  };

  return (
    <div className="bg-[#03060f]/95 border border-zinc-800 p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col h-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className={`size-4 ${isAgentActive ? 'text-emerald-400 animate-spin' : 'text-zinc-500'}`} />
          <h2 className="text-sm font-mono font-bold tracking-wider text-white">
            AI AGENT TELEMETRY STREAM
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
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Console Scroll Area */}
      <div
        ref={scrollRef}
        className="mt-3 flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 select-text scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic py-8 text-center font-mono">
            // No telemetry events recorded. Dispatch a strategy directive to initialize telemetry.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="leading-relaxed flex items-start gap-2">
              <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`break-words ${getTypeStyle(log.type)}`}>{log.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer */}
      <div className="mt-2 pt-2 border-t border-zinc-900 text-[10px] font-mono text-zinc-600 flex items-center justify-between shrink-0">
        <span>TELEMETRY CHANNEL // HIGH-FREQUENCY PROTOCOL</span>
        <span>EVENTS: {logs.length}</span>
      </div>
    </div>
  );
}
