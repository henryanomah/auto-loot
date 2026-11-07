import { describe, it, expect } from 'vitest';
import { getProtocolSigner, broadcastOnChainSettlement } from '../lib/solana-settlement';

describe('Server-Side Solana Settlement Core', () => {
  it('should load a valid Solana protocol signer', async () => {
    const signer = await getProtocolSigner();
    expect(signer).toBeDefined();
    expect(signer.address).toBeDefined();
    expect(signer.address.length).toBeGreaterThanOrEqual(32);
  });

  it('should construct and sign an atomic trade settlement transaction', async () => {
    const result = await broadcastOnChainSettlement({
      memo: 'AutoLoot Settlement Unit Test: -20 $IRON -> +2.5 $GOLD',
    });

    expect(result).toBeDefined();
    expect(result.signerAddress).toBeDefined();
    expect(result.signature).toBeDefined();
    expect(result.signature.length).toBeGreaterThanOrEqual(64);
  });
});
