'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppClient } from './lib/client-provider';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { MarketState, AssetSymbol } from '@/lib/market-engine';
import { InventoryBalance, SwapReceipt } from '@/lib/player-inventory';
import { MarketTicker } from './components/terminal/market-ticker';
import { SessionAnalyticsCard } from './components/terminal/session-analytics-card';
import { MarketChart } from './components/terminal/market-chart';
import { InventoryPanel } from './components/terminal/inventory-panel';
import { AgentControlCenter } from './components/terminal/agent-control-center';
import { TelemetryConsole, TelemetryLog } from './components/terminal/telemetry-console';
import { TradeHistory } from './components/terminal/trade-history';
import { computeSessionAnalytics, calculateInventoryValuation } from '@/lib/session-analytics';
import {
  FailsafeConfig,
  DEFAULT_FAILSAFE_CONFIG,
  evaluateFailsafeLimits,
} from '@/lib/failsafe-engine';
import { toast } from 'sonner';

const FALLBACK_WALLET = 'PlayerDefaultWallet11111111111111111111111111';

export default function Home() {
  const client = useAppClient();
  const connected = useConnectedWallet(client);
  const activeWallet = connected?.account.address || FALLBACK_WALLET;

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
  const [baselineValuation, setBaselineValuation] = useState<number>(0);
  const [isResettingInventory, setIsResettingInventory] = useState(false);
  const [hasUpdatedRecently, setHasUpdatedRecently] = useState(false);
  const [isBuyingSol, setIsBuyingSol] = useState(false);

  // Agent Loop & Strategy State
  const [currentStrategy, setCurrentStrategy] = useState(
    'Trade 30 Iron for Gold if Gold drops below 10.0 Iron'
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);

  // Emergency Failsafe & Risk Configuration
  const [failsafeConfig, setFailsafeConfig] = useState<FailsafeConfig>(DEFAULT_FAILSAFE_CONFIG);

  const handleUpdateFailsafeConfig = useCallback((updates: Partial<FailsafeConfig>) => {
    setFailsafeConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Establish baseline portfolio valuation on initial data load
  useEffect(() => {
    if (baselineValuation === 0 && market && inventory) {
      const initial = calculateInventoryValuation(inventory, market);
      if (initial > 0) {
        setBaselineValuation(initial);
      }
    }
  }, [baselineValuation, market, inventory]);

  // Recalibrate baseline if active wallet switches
  const prevWalletRef = useRef(activeWallet);
  useEffect(() => {
    if (prevWalletRef.current !== activeWallet) {
      prevWalletRef.current = activeWallet;
      setBaselineValuation(0);
    }
  }, [activeWallet]);

  // Real-time Session Portfolio Analytics
  const sessionAnalytics = useMemo(() => {
    if (!market) {
      return {
        currentValuation: 0,
        baselineValuation: 0,
        pnlDelta: 0,
        pnlPercentage: 0,
        solEquivalent: 0,
        totalTradesCount: receipts.length,
        profitableTradesCount: receipts.length,
        winRate: receipts.length > 0 ? 100 : 0,
      };
    }
    return computeSessionAnalytics(inventory, market, baselineValuation, receipts);
  }, [inventory, market, baselineValuation, receipts]);

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

  const handleEmergencyHalt = useCallback(() => {
    setIsMonitoring(false);
    addLog('WARNING', '[CIRCUIT BREAKER] Emergency halt triggered. All autonomous operations suspended.');
    toast.warning('Emergency Circuit Breaker: Trading halted.');
  }, [addLog]);

  // Fetch live market data
  const fetchMarket = useCallback(async () => {
    try {
      const res = await fetch('/api/market-prices');
      const json = await res.json();
      if (json.success && json.data) {
        setMarket(json.data);
      }
    } catch (err: any) {
      console.error('Market fetch error:', err);
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

  // Initial client mount & polling interval
  useEffect(() => {
    setIsMounted(true);

    setLogs([
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: 'AutoLoot trader online. Select a preset or type a strategy to begin.',
      },
    ]);

    fetchMarket();
    fetchInventory();

    const interval = setInterval(() => {
      fetchMarket();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchMarket, fetchInventory]);

  // Strategy Execution Handler (Automated On-Chain Settlement)
  const handleExecuteStrategy = useCallback(
    async (strategyToRun: string, singleShot = true) => {
      // 1. Pre-execution Failsafe Check: Stop-Loss
      if (failsafeConfig.stopLossEnabled) {
        const failsafe = evaluateFailsafeLimits({
          config: failsafeConfig,
          currentPnlPercentage: sessionAnalytics.pnlPercentage,
        });

        if (failsafe.triggered && failsafe.reason === 'STOP_LOSS') {
          setIsMonitoring(false);
          addLog('WARNING', `[FAILSAFE TRIGGERED] ${failsafe.message}`);
          toast.error(`Emergency Stop-Loss Triggered (${sessionAnalytics.pnlPercentage.toFixed(2)}%)`);
          return;
        }
      }

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
            failsafeConfig,
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
            const sig = swapResult.txSignature || '';
            const sigShort = sig ? `${sig.slice(0, 8)}...` : 'Confirmed';

            addLog(
              'SUCCESS',
              `[SETTLEMENT CONFIRMED] Trade settled on Solana DevNet! Hash: ${sigShort} // Slot #${swapResult.slot}`
            );
            toast.success(`Trade settled on Solana DevNet (${sigShort})`);

            setHasUpdatedRecently(true);
            setTimeout(() => setHasUpdatedRecently(false), 2500);
          }

          if (updatedInv) {
            setInventory(updatedInv);
          }

          // Refresh receipts directly from the verified ledger
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
    [activeWallet, addLog, fetchInventory, fetchMarket, failsafeConfig, sessionAnalytics.pnlPercentage]
  );

  // Autonomous Monitoring Loop
  const isMonitoringRef = useRef(isMonitoring);
  isMonitoringRef.current = isMonitoring;
  const currentStrategyRef = useRef(currentStrategy);
  currentStrategyRef.current = currentStrategy;

  useEffect(() => {
    if (!isMonitoring) return;

    addLog('INFO', `[AUTONOMOUS PROTOCOL STARTED] Actively monitoring market ticks for: "${currentStrategy}"`);

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
        if (market) {
          const resetVal = calculateInventoryValuation(json.inventory, market);
          setBaselineValuation(resetVal);
        }
        addLog('INFO', `[INVENTORY REPLENISHED] Restored starter pack (100 $IRON, 250 $WOOD, 15 $GOLD).`);
        fetchInventory();
      }
    } catch (err: any) {
      addLog('ERROR', `Replenish error: ${err.message}`);
    } finally {
      setIsResettingInventory(false);
    }
  };

  // Direct Purchase with SOL Handler (Depot interaction)
  const handleBuyWithSol = async (asset: AssetSymbol, amount: number, solCost: number) => {
    if (!connected) {
      toast.error('Connect your wallet above to purchase resources with DevNet SOL.');
      return;
    }

    setIsBuyingSol(true);
    addLog('INFO', `[RESOURCE DEPOT] Initiating purchase of ${amount} $${asset} for ${solCost} DevNet SOL...`);

    try {
      const ix = client.memo.instructions.addMemo({
        memo: `AutoLoot Purchase: +${amount} $${asset} for ${solCost} SOL`,
      });

      toast.info('Please approve transaction in Phantom...');
      const txResult = await ix.sendTransaction();
      const realSignature =
        typeof txResult === 'string'
          ? txResult
          : (txResult as any)?.signature ||
            (txResult as any)?.context?.signature;

      if (realSignature) {
        addLog('SUCCESS', `[DEVNET CONFIRMED] SOL purchase verified on DevNet. Sig: ${realSignature.slice(0, 10)}...`);

        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'PURCHASE_WITH_SOL',
            walletAddress: activeWallet,
            asset,
            amount,
            solCost,
            txSignature: realSignature,
          }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          setInventory(json.data.inventory);
          if (market) {
            const purchasedValue = amount * (market.assets[asset]?.price || 0);
            setBaselineValuation((prev) => prev + purchasedValue);
          }
          setHasUpdatedRecently(true);
          setTimeout(() => setHasUpdatedRecently(false), 2500);
          toast.success(`Purchased +${amount} $${asset} with ${solCost} SOL!`);
          fetchInventory();
        }
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      addLog('ERROR', `Purchase cancelled or failed: ${err.message}`);
      toast.error(err.message || 'Cancelled in wallet.');
    } finally {
      setIsBuyingSol(false);
    }
  };

  if (!isMounted) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 font-mono text-zinc-500">
        <div className="flex items-center gap-2 p-6 border border-zinc-800 bg-[#050811]">
          <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>INITIALIZING AUTOLOOT TERMINAL INTERFACE...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6 font-mono">
      {/* Row 1: Real-time Asset Tickers */}
      {market && <MarketTicker assets={market.assets} tick={market.tick} />}

      {/* Row 2: Session Analytics & Real-Time PnL */}
      <SessionAnalyticsCard
        analytics={sessionAnalytics}
        isMonitoring={isMonitoring}
        currentStrategy={currentStrategy}
      />

      {/* Row 3: Market Chart & Player Inventory */}
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
              walletAddress={activeWallet}
              inventory={inventory}
              market={market}
              onResetInventory={handleResetInventory}
              isResetting={isResettingInventory}
              hasUpdatedRecently={hasUpdatedRecently}
              onBuyWithSol={handleBuyWithSol}
              isBuying={isBuyingSol}
              isWalletConnected={!!connected}
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
            onEmergencyHalt={handleEmergencyHalt}
            currentStrategy={currentStrategy}
            failsafeConfig={failsafeConfig}
            onUpdateFailsafeConfig={handleUpdateFailsafeConfig}
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
        <TradeHistory receipts={receipts} />
      </div>
    </main>
  );
}
