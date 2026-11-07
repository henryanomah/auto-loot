"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { address, formatDecimalFixedPoint, lamportsToSol } from "@solana/kit";
import {
  useWallets,
  useConnect,
  useDisconnect,
  useConnectedWallet,
  useIsWalletReady,
} from "@solana/kit-plugin-wallet/react";
import { useBalance } from "../lib/hooks/use-balance";
import { ellipsify } from "../lib/explorer";
import { useCluster } from "./cluster-context";
import { useAppClient } from "../lib/client-provider";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const solFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 9,
});
const subscribeToHydration = () => () => {};

export function WalletButton() {
  const client = useAppClient();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const isWalletReady = useIsWalletReady(client);
  const {
    dispatchAsync: connect,
    error: connectError,
    isRunning: isConnecting,
  } = useConnect(client);
  const {
    dispatchAsync: disconnect,
    error: disconnectError,
    isRunning: isDisconnecting,
  } = useDisconnect(client);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );

  const { getExplorerUrl } = useCluster();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<{
    address: string;
    message: string;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const walletAddress = connected?.account.address;
  const copied = copiedAddress === walletAddress;
  const balance = useBalance(
    walletAddress ? address(walletAddress) : undefined
  );
  const connectMenuError = connectError;
  const accountMenuError =
    disconnectError ??
    (clipboardError && clipboardError.address === walletAddress
      ? clipboardError.message
      : null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const closeAndRestoreFocus = () => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setClipboardError(null);
      setCopiedAddress(walletAddress);
      setTimeout(
        () =>
          setCopiedAddress((current) =>
            current === walletAddress ? null : current
          ),
        2000
      );
    } catch {
      setClipboardError({
        address: walletAddress,
        message: "Unable to copy the address to the clipboard.",
      });
    }
  };

  if (!isHydrated || !isWalletReady) {
    return (
      <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-zinc-500">
        <span className="size-2 rounded-full bg-zinc-600 animate-pulse" />
        <span>INITIALIZING...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="relative font-mono" ref={ref}>
        <button
          ref={triggerRef}
          onClick={() => (isOpen ? close() : open())}
          aria-expanded={isOpen}
          aria-controls={isOpen ? "wallet-options" : undefined}
          className="flex items-center gap-2 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-1.5 text-xs font-mono font-bold text-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.2)] transition-all cursor-pointer group"
        >
          <Wallet className="size-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>CONNECT WALLET</span>
          <ChevronDown className="size-3 text-cyan-400" />
        </button>

        {isOpen && (
          <div
            id="wallet-options"
            className="absolute right-0 top-full z-50 mt-2 w-72 border border-cyan-500/30 bg-[#060b18]/95 backdrop-blur-md p-4 shadow-[0_0_25px_rgba(0,243,255,0.15)] font-mono text-zinc-100"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                SELECT SOLANA WALLET
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                DEVNET
              </span>
            </div>

            {wallets.length === 0 ? (
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 text-center">
                <p className="text-xs text-zinc-400">
                  No Solana wallets detected. Please install Phantom or Solflare.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={async () => {
                      try {
                        await connect(wallet);
                        closeAndRestoreFocus();
                      } catch {
                        // The hook exposes the connection error below.
                      }
                    }}
                    disabled={isConnecting}
                    className="flex w-full items-center justify-between border border-zinc-800 hover:border-cyan-500/50 bg-zinc-950/60 hover:bg-cyan-500/10 px-3 py-2 text-left text-xs font-mono font-bold text-zinc-200 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      {wallet.icon && (
                        // eslint-disable-next-line @next/next/no-img-element -- wallet-standard icons are data URIs
                        <img
                          src={wallet.icon}
                          alt=""
                          className="size-4 rounded-none"
                        />
                      )}
                      <span>{wallet.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">CONNECT ↗</span>
                  </button>
                ))}
              </div>
            )}

            {isConnecting && (
              <div className="mt-2 flex items-center gap-2 text-xs text-cyan-400 font-mono">
                <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Requesting connection...</span>
              </div>
            )}

            {connectMenuError != null && (
              <div className="mt-3 space-y-1.5 border-t border-zinc-800 pt-2.5">
                <div className="flex items-start gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                  <p className="break-words font-mono [overflow-wrap:anywhere]">
                    {connectMenuError instanceof Error
                      ? connectMenuError.message
                      : String(connectMenuError)}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  AutoLoot runs on Solana DevNet. Connect a native Solana wallet like <strong>Phantom</strong> or <strong>Solflare</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative font-mono" ref={ref}>
      <button
        ref={triggerRef}
        onClick={() => (isOpen ? close() : open())}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "wallet-options" : undefined}
        aria-label={`Wallet ${walletAddress}`}
        className="flex cursor-pointer items-center gap-2 border border-zinc-800 hover:border-cyan-500/50 bg-[#060b18] px-3 py-1.5 text-xs font-mono transition-all group"
      >
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
        <span className="font-mono font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors">
          {ellipsify(walletAddress!, 4)}
        </span>
        {balance.lamports != null && (
          <span className="text-zinc-400 text-[11px] font-mono hidden sm:inline">
            ({formatDecimalFixedPoint(solFormatter, lamportsToSol(balance.lamports))} SOL)
          </span>
        )}
        <ChevronDown className="size-3 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
      </button>

      {isOpen && (
        <div
          id="wallet-options"
          className="absolute right-0 top-full z-50 mt-2 w-80 border border-cyan-500/40 bg-[#060b18]/95 backdrop-blur-md p-4 shadow-[0_0_25px_rgba(0,243,255,0.2)] font-mono text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase">
                SOLANA WALLET
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              CONNECTED // DEVNET
            </span>
          </div>

          {/* Balance Section */}
          <div className="mb-3 p-3 bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                DevNet Balance
              </span>
              <span className="text-[10px] font-mono text-zinc-500">RPC: SYNCED</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {balance.lamports != null
                  ? formatDecimalFixedPoint(
                      solFormatter,
                      lamportsToSol(balance.lamports)
                    )
                  : balance.isLoading
                    ? "Syncing..."
                    : "0.00"}
              </span>
              <span className="text-xs font-bold font-mono text-cyan-400">SOL</span>
            </div>
            {balance.error != null && (
              <p className="mt-1.5 text-[11px] text-rose-400" role="alert">
                Unable to load wallet balance from DevNet RPC.
              </p>
            )}
          </div>

          {/* Public Key Card */}
          <div className="mb-3 p-2.5 bg-zinc-950/80 border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">
                Account Public Key
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {copied ? "COPIED!" : "COPY"}
              </button>
            </div>
            <p className="break-all font-mono text-xs text-zinc-300 bg-zinc-900/60 p-1.5 border border-zinc-800/80 select-all">
              {walletAddress}
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 border border-zinc-800 hover:border-cyan-500/50 bg-zinc-900/80 hover:bg-cyan-500/10 px-3 py-1.5 text-xs text-zinc-200 hover:text-cyan-300 font-bold transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5 text-cyan-400" />
              )}
              <span>{copied ? "COPIED" : "COPY ADDRESS"}</span>
            </button>
            <a
              href={getExplorerUrl(`/address/${walletAddress}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 border border-zinc-800 hover:border-cyan-500/50 bg-zinc-900/80 hover:bg-cyan-500/10 px-3 py-1.5 text-xs text-zinc-200 hover:text-cyan-300 font-bold transition-all"
            >
              <ExternalLink className="size-3.5 text-cyan-400" />
              <span>EXPLORER ↗</span>
            </a>
          </div>

          {/* Disconnect Button */}
          <button
            type="button"
            onClick={async () => {
              try {
                await disconnect();
                closeAndRestoreFocus();
              } catch {
                // The hook exposes the disconnection error below.
              }
            }}
            disabled={isDisconnecting}
            className="flex w-full items-center justify-center gap-2 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 text-xs font-mono font-bold text-rose-300 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
          >
            <LogOut className="size-3.5" />
            <span>{isDisconnecting ? "DISCONNECTING..." : "DISCONNECT WALLET"}</span>
          </button>

          {accountMenuError != null && (
            <p
              className="mt-2 break-words text-xs text-rose-400 [overflow-wrap:anywhere]"
              role="alert"
            >
              {accountMenuError instanceof Error
                ? accountMenuError.message
                : String(accountMenuError)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
