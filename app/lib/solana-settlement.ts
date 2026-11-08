import {
  createKeyPairSignerFromBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  generateKeyPairSigner,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  pipe,
  createSolanaRpc,
  address,
  AccountRole,
  type KeyPairSigner,
  type Blockhash,
} from '@solana/kit';
import { getAddMemoInstruction } from '@solana-program/memo';
import bs58 from 'bs58';
import fs from 'fs';
import path from 'path';

let cachedSigner: KeyPairSigner | null = null;

function encodeBase58(bytes: Uint8Array): string {
  if (typeof (bs58 as any).encode === 'function') {
    return (bs58 as any).encode(bytes);
  }
  return (bs58 as any).default.encode(bytes);
}

function decodeBase58(str: string): Uint8Array {
  if (typeof (bs58 as any).decode === 'function') {
    return (bs58 as any).decode(str);
  }
  return (bs58 as any).default.decode(str);
}

/**
 * Loads the funded Solana DevNet protocol signer.
 * Checks environment variable or local CLI configuration.
 */
export async function getProtocolSigner(): Promise<KeyPairSigner> {
  if (cachedSigner) return cachedSigner;

  // 1. Check environment variable SOLANA_PRIVATE_KEY
  if (process.env.SOLANA_PRIVATE_KEY) {
    try {
      let raw = process.env.SOLANA_PRIVATE_KEY.trim();
      // Strip outer double or single quotes if copied from dashboard
      if (
        (raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))
      ) {
        raw = raw.slice(1, -1).trim();
      }

      let keyBytes: Uint8Array | null = null;
      if (raw.startsWith('[') && raw.endsWith(']')) {
        keyBytes = new Uint8Array(JSON.parse(raw));
      } else {
        try {
          keyBytes = decodeBase58(raw);
        } catch {
          keyBytes = new Uint8Array(Buffer.from(raw, 'base64'));
        }
      }

      if (keyBytes) {
        if (keyBytes.length === 64) {
          cachedSigner = await createKeyPairSignerFromBytes(keyBytes);
          return cachedSigner;
        } else if (keyBytes.length === 32) {
          cachedSigner = await createKeyPairSignerFromPrivateKeyBytes(keyBytes);
          return cachedSigner;
        }
      }
    } catch (e) {
      console.warn('Failed to parse SOLANA_PRIVATE_KEY env var:', e);
    }
  }

  // 2. Check local Solana CLI keypair file (~/.config/solana/id.json)
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const candidatePath = path.join(homeDir, '.config', 'solana', 'id.json');
  if (fs.existsSync(candidatePath)) {
    try {
      const fileContent = fs.readFileSync(candidatePath, 'utf8');
      const bytes = new Uint8Array(JSON.parse(fileContent));
      if (bytes.length === 64) {
        cachedSigner = await createKeyPairSignerFromBytes(bytes);
        return cachedSigner;
      }
    } catch (e) {
      console.warn('Failed to load ~/.config/solana/id.json:', e);
    }
  }

  // 3. Fallback: generate a valid ephemeral keypair
  cachedSigner = await generateKeyPairSigner();
  return cachedSigner;
}

export function getDefaultDevNetRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
}

/**
 * Broadcasts an atomic trade settlement on Solana DevNet using the protocol fee payer.
 * Returns the real transaction signature and block slot.
 */
export async function broadcastOnChainSettlement({
  memo,
  playerWalletAddress,
  rpcUrl = getDefaultDevNetRpcUrl(),
}: {
  memo: string;
  playerWalletAddress?: string;
  rpcUrl?: string;
}): Promise<{
  signature: string;
  slot: number;
  signerAddress: string;
  isSuccess: boolean;
  isConfirmed: boolean;
  broadcastError?: string | null;
}> {
  try {
    const signer = await getProtocolSigner();
    const rpc = createSolanaRpc(rpcUrl);

    // Fetch latest blockhash and slot from Solana DevNet
    let blockhashLifetime: { blockhash: Blockhash; lastValidBlockHeight: bigint } | null = null;
    let currentSlot = 284000000;
    let rpcErrorNote: string | null = null;

    try {
      const latestBlock = await rpc.getLatestBlockhash().send();
      blockhashLifetime = {
        blockhash: latestBlock.value.blockhash as Blockhash,
        lastValidBlockHeight: latestBlock.value.lastValidBlockHeight,
      };
      const slotResult = await rpc.getSlot().send();
      currentSlot = Number(slotResult);
    } catch (bhErr: any) {
      rpcErrorNote = bhErr?.message || String(bhErr);
      // Fallback blockhash for offline unit testing/simulations
      blockhashLifetime = {
        blockhash: '4hsy53Fpv7U48cZ1gE1w4m5hXW8Y1QxQyX7Z8Z8Z8Z8Z' as Blockhash,
        lastValidBlockHeight: 300000000n,
      };
    }

    const baseMemoIx = getAddMemoInstruction({ memo });
    let memoIx: any = baseMemoIx;

    // Link player's wallet address as a readonly account so the transaction
    // is permanently indexed and visible under the player's wallet on Solana Explorer
    if (playerWalletAddress && playerWalletAddress.length >= 32 && playerWalletAddress.length <= 44) {
      try {
        memoIx = {
          ...baseMemoIx,
          accounts: [
            { address: address(playerWalletAddress), role: AccountRole.READONLY },
          ],
        };
      } catch {
        memoIx = baseMemoIx;
      }
    }

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(signer, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
      (m) => appendTransactionMessageInstruction(memoIx, m)
    );

    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    const sigBytes = signedTransaction.signatures[signer.address];
    const signature = sigBytes ? encodeBase58(sigBytes) : '';
    const wireTransaction = getBase64EncodedWireTransaction(signedTransaction);

    // If blockhash lookup failed earlier, we cannot broadcast to DevNet
    if (rpcErrorNote) {
      return {
        signature,
        slot: currentSlot,
        signerAddress: signer.address,
        isSuccess: false,
        isConfirmed: false,
        broadcastError: `DevNet RPC blockhash unreachable: ${rpcErrorNote}`,
      };
    }

    let isConfirmed = false;
    let broadcastError: string | null = null;

    try {
      await rpc.sendTransaction(wireTransaction, { encoding: 'base64' }).send();
      isConfirmed = true;
    } catch (rpcErr: any) {
      broadcastError = rpcErr?.message || String(rpcErr);
      console.warn('DevNet broadcast RPC send note:', broadcastError);
    }

    return {
      signature: isConfirmed ? signature : signature,
      slot: currentSlot,
      signerAddress: signer.address,
      isSuccess: isConfirmed,
      isConfirmed,
      broadcastError,
    };
  } catch (err: any) {
    console.error('Failed to broadcast on-chain settlement:', err);
    return {
      signature: '',
      slot: 284000000,
      signerAddress: '',
      isSuccess: false,
      isConfirmed: false,
      broadcastError: err?.message || 'Settlement broadcast error',
    };
  }
}
