import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateSessionSigner,
  getSessionKeyStatus,
  setSessionKeyActive,
  revokeSessionKey,
  signAndBroadcastSessionMemo,
} from '../lib/session-key';
import type { Blockhash } from '@solana/kit';

describe('Feature 4: Ephemeral Session Keypair Delegation (ADR-0001)', () => {
  beforeEach(() => {
    revokeSessionKey();
  });

  it('should initialize status as inactive when no session exists', () => {
    const status = getSessionKeyStatus();
    expect(status.hasStoredKey).toBe(false);
    expect(status.isActive).toBe(false);
    expect(status.address).toBe('');
  });

  it('should generate a new cryptographically valid Ed25519 session key', async () => {
    const result = await getOrCreateSessionSigner();
    expect(result.isNew).toBe(true);
    expect(result.address).toBeDefined();
    expect(result.address.length).toBeGreaterThanOrEqual(32);
    expect(result.signer).toBeDefined();

    // Restoring should return the exact same address
    const secondCall = await getOrCreateSessionSigner();
    expect(secondCall.isNew).toBe(false);
    expect(secondCall.address).toBe(result.address);
  });

  it('should toggle active status and allow revocation', async () => {
    await getOrCreateSessionSigner();
    setSessionKeyActive(true);

    let status = getSessionKeyStatus();
    expect(status.hasStoredKey).toBe(true);
    expect(status.isActive).toBe(true);

    setSessionKeyActive(false);
    status = getSessionKeyStatus();
    expect(status.isActive).toBe(false);

    revokeSessionKey();
    status = getSessionKeyStatus();
    expect(status.hasStoredKey).toBe(false);
  });

  it('should autonomously sign an on-chain settlement memo without wallet popup', async () => {
    const customBlockhash = {
      blockhash: '4hsy53Fpv7U48cZ1gE1w4m5hXW8Y1QxQyX7Z8Z8Z8Z8Z' as Blockhash,
      lastValidBlockHeight: 300000000n,
    };

    const settlement = await signAndBroadcastSessionMemo({
      memo: 'AutoLoot Settlement: -50 $IRON -> +5.5 $GOLD',
      customBlockhash,
    });

    expect(settlement.signature).toBeDefined();
    expect(settlement.signature.length).toBeGreaterThanOrEqual(64);
    expect(settlement.signerAddress).toBeDefined();
    expect(settlement.wireTransaction).toBeDefined();
    expect(typeof settlement.wireTransaction).toBe('string');
  });
});
