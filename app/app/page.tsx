'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppClient } from './lib/client-provider';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { MarketState, AssetSymbol } from '@/lib/market-engine';
import { InventoryBalance, SwapReceipt } from '@/lib/player-inventory';
import { MarketTicker } from './components/terminal/market-ticker';
import { MarketChart } from './components/terminal/market-chart';
import { InventoryPanel } from './components/terminal/inventory-panel';
import { AgentControlCenter } from './components/terminal/agent-control-center';
import { TelemetryConsole, TelemetryLog } from './components/terminal/telemetry-console';
import { TradeHistory } from './components/terminal/trade-history';
import { Radio } from 'lucide-react';
import { toast } from 'sonner';

const FALLBACK_SESSION_WALLET = 'AutoLootSession11111111111111111111111111111';

export default function Home() {
  const client = useAppClient();
  const connected = useConnectedWallet(client);
  const activeWallet = connected?.account.address || FALLBACK_SESSION_WALLET;

  const [isMounted, setIsMounted] = useState(false);

  // Market State
  const [market, setMarket] = useState<MarketState | null>(null);
  const [isShockLoading, setIsShockLoading] = useState(false);

  // Inventory & History State
  const [inventory, setInventory] = useState<InventoryBalance>({
    WOOD: 250,
    IRON: 100,
    GOLD: 15,
  });
  const [receipts, setReceipts] = useState<SwapReceipt[]>([]);
  const [isResettingInventory, setIsResettingInventory] = useState(false);
  const [hasUpdatedRecently, setHasUpdatedRecently] = useState(false);

  // Agent Loop & Strategy State
  const [currentStrategy, setCurrentStrategy] = useState(
    'Trade 30 Iron for Gold if Gold drops below 10.0 Iron'
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);

  const addLog = useCallback((type: TelemetryLog['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  }, []);

  // Fetch live market prices
  const fetchMarket = useCallback(async () => {
    try {
      const res = await fetch('/api/market-prices');
      const data = await res.json();
      if (data.success && data.data) {
        setMarket(data.data);
      }
    } catch (err: any) {
      console.error('Market tick error:', err);
    }
  }, []);

  // Fetch player inventory & receipts
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent?walletAddress=${encodeURIComponent(activeWallet)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setInventory(json.data.inventory);
        if (json.data.recentSwaps) {
          setReceipts(json.data.recentSwaps);
        }
      }
    } catch (err: any) {
      console.error('Inventory fetch error:', err);
    }
  }, [activeWallet]);

  // Initial client mount & 5-second polling interval
  useEffect(() => {
    setIsMounted(true);
    setLogs([
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: 'AUTOLOOT OS INITIALIZED // Solana DevNet Cluster Connection: ESTABLISHED',
      },
      {
        id: 'init-2',
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: 'Autonomous Economic Agent: ONLINE. Standing by for strategy dispatch.',
      },
    ]);

    fetchMarket();
    fetchInventory();

    const interval = setInterval(() => {
      fetchMarket();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchMarket, fetchInventory]);

  // Strategy Execution Handler
  const handleExecuteStrategy = useCallback(
    async (strategyToRun: string, singleShot = true) => {
      setIsEvaluating(true);
      setCurrentStrategy(strategyToRun);

      try {
        addLog('INFO', `[AGENT DISPATCH] Evaluating strategy against prevailing tick: "${strategyToRun}"`);

        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy: strategyToRun,
            walletAddress: activeWallet,
            evolveMarket: true,
          }),
        });

        const json = await res.json();

        if (json.success && json.data) {
          const { decision, executed, thoughtLog, swapResult, inventory: updatedInv, market: updatedMarket } = json.data;

          if (updatedMarket) {
            fetchMarket();
          }

          if (thoughtLog) {
            addLog(executed ? 'SUCCESS' : decision === 'HOLD' ? 'INFO' : 'WARNING', thoughtLog);
          }

          if (executed && swapResult) {
            addLog(
              'SUCCESS',
              `[TRADE EXECUTED] In-game settlement confirmed. Slot #${swapResult.slot}`
            );
            setHasUpdatedRecently(true);
            setTimeout(() => setHasUpdatedRecently(false), 2500);
          }

          if (updatedInv) {
            setInventory(updatedInv);
          }

          // Refresh receipts
          fetchInventory();
        } else {
          addLog('ERROR', json.error || 'Failed to evaluate agent strategy.');
        }
      } catch (err: any) {
        addLog('ERROR', `Network error during agent execution: ${err.message}`);
      } finally {
        setIsEvaluating(false);
      }
    },
    [activeWallet, addLog, fetchInventory, fetchMarket]
  );

  // Autonomous Monitoring Loop
  const isMonitoringRef = useRef(isMonitoring);
  isMonitoringRef.current = isMonitoring;
  const currentStrategyRef = useRef(currentStrategy);
  currentStrategyRef.current = currentStrategy;

  useEffect(() => {
    if (!isMonitoring) return;

    addLog('INFO', `[AUTONOMOUS LOOP STARTED] Actively monitoring market ticks for: "${currentStrategy}"`);

    const loop = setInterval(() => {
      if (isMonitoringRef.current) {
        handleExecuteStrategy(currentStrategyRef.current, false);
      }
    }, 5000);

    return () => {
      clearInterval(loop);
    };
  }, [isMonitoring, handleExecuteStrategy, addLog, currentStrategy]);

  // Market Shock Trigger Handler
  const handleTriggerShock = async (asset: AssetSymbol, direction: 'UP' | 'DOWN') => {
    setIsShockLoading(true);
    addLog('WARNING', `[MARKET VOLATILITY INJECTED] Applied ${direction} shock on $${asset}`);
    try {
      const res = await fetch('/api/market-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, direction }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMarket(data.data);
        addLog(
          'INFO',
          `[MARKET SHIFT] New ${asset} price: ${data.data.assets[asset].price} CR (Cross-Rate: 1 GOLD = ${data.data.crossRates.IRON_PER_GOLD} IRON)`
        );

        if (isMonitoringRef.current) {
          handleExecuteStrategy(currentStrategyRef.current, false);
        }
      }
    } catch (err: any) {
      addLog('ERROR', `Failed to apply volatility shock: ${err.message}`);
    } finally {
      setIsShockLoading(false);
    }
  };

  // Reset Inventory Faucet Handler
  const handleResetInventory = async () => {
    setIsResettingInventory(true);
    try {
      const res = await fetch(`/api/agent?walletAddress=${encodeURIComponent(activeWallet)}&reset=true`);
      const json = await res.json();
      if (json.success && json.inventory) {
        setInventory(json.inventory);
        addLog('INFO', `[FAUCET] Inventory replenished to starter pack (100 $IRON, 250 $WOOD, 15 $GOLD).`);
        fetchInventory();
      }
    } catch (err: any) {
      addLog('ERROR', `Faucet replenish error: ${err.message}`);
    } finally {
      setIsResettingInventory(false);
    }
  };

  // On-Chain Broadcast Handler using Phantom
  const handleCommitOnChain = async (receiptId: string, summary: string) => {
    if (!connected) {
      toast.error('Please connect Phantom to broadcast to Solana DevNet.');
      return;
    }

    try {
      addLog('INFO', `[PHANTOM PROMPT] Requesting on-chain signature for trade: ${summary}...`);

      const ix = client.memo.instructions.addMemo({
        memo: `AutoLoot Settlement: ${summary}`,
      });

      const txResult = await ix.sendTransaction();
      const realSignature =
        typeof txResult === 'string'
          ? txResult
          : (txResult as any)?.signature ||
            (txResult as any)?.context?.signature;

      if (realSignature) {
        addLog(
          'SUCCESS',
          `[BROADCAST VERIFIED] Transaction confirmed on Solana DevNet! Hash: ${realSignature.slice(0, 10)}...`
        );
        toast.success('Trade verified on Solana DevNet!');

        setReceipts((prev) =>
          prev.map((r) =>
            r.id === receiptId
              ? { ...r, txSignature: realSignature, isOnChain: true }
              : r
          )
        );
      }
    } catch (err: any) {
      console.error('On-chain commit error:', err);
      addLog('ERROR', `Solana DevNet broadcast cancelled or failed: ${err.message}`);
      toast.error('On-chain broadcast failed: ' + (err.message || 'Cancelled'));
    }
  };

  if (!isMounted) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 font-mono text-zinc-500">
        // Loading AutoLoot Terminal...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 font-mono space-y-6">
      {/* Top Banner Notice if Using Fallback Session Wallet */}
      {!connected && (
        <div className="flex items-center justify-between px-4 py-2 bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Radio className="size-3.5 text-cyan-400 animate-pulse" />
            <span>
              <strong>SESSION MODE ACTIVE:</strong> Operating on dedicated Solana DevNet Session Keypair. Connect Phantom above to trade with your personal wallet!
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 hidden sm:block">ZERO POPUPS IN SESSION MODE</span>
        </div>
      )}

      {/* Row 1: Live Commodity Market Tickers */}
      {market && <MarketTicker assets={market.assets} tick={market.tick} />}

      {/* Row 2: Live Market Chart & Player Inventory Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {market && (
            <MarketChart
              market={market}
              onTriggerShock={handleTriggerShock}
              isLoadingShock={isShockLoading}
            />
          )}
        </div>
        <div>
          {market && (
            <InventoryPanel
              inventory={inventory}
              walletAddress={activeWallet}
              market={market}
              onResetInventory={handleResetInventory}
              isResetting={isResettingInventory}
              hasUpdatedRecently={hasUpdatedRecently}
            />
          )}
        </div>
      </div>

      {/* Row 3: Agent Control Center & Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AgentControlCenter
            onSubmitStrategy={(strategy) => handleExecuteStrategy(strategy, true)}
            isEvaluating={isEvaluating}
            isMonitoring={isMonitoring}
            onToggleMonitoring={() => setIsMonitoring((prev) => !prev)}
            currentStrategy={currentStrategy}
          />
        </div>
        <div>
          <TelemetryConsole
            logs={logs}
            onClearLogs={() => setLogs([])}
            isAgentActive={isMonitoring || isEvaluating}
          />
        </div>
      </div>

      {/* Row 4: Trade Settlement Ledger */}
      <div>
        <TradeHistory
          receipts={receipts}
          onCommitOnChain={handleCommitOnChain}
          isWalletConnected={!!connected}
        />
      </div>
    </main>
  );
}
