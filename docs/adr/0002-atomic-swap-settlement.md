---
status: accepted
date: 2026-11-06
decision-makers: [Developer, AI Architect]
---

# ADR-0002: Atomic Swap Settlement via Server-Side Market Maker Vault

## Context
AutoLoot simulates a live in-game market where prices for $IRON, $WOOD, and $GOLD fluctuate. When the Autonomous Agent decides to execute an Asset Swap, that swap must settle on Solana DevNet to prove genuine tokenized asset ownership.

We evaluated two settlement architectures:
1. **Option A (Centralized Market Maker / Treasury Keypair with Atomic SPL Transfers):** A server-managed Treasury holds supplies of the three SPL tokens. A swap is packaged as a single atomic Solana transaction containing two standard SPL transfer instructions (Player -> Treasury, and Treasury -> Player).
2. **Option C (Burn & Mint):** The agent burns the sold asset from the player's account and mints the purchased asset directly using mint authority.

Deploying full AMM contracts (e.g. Raydium/Orca pools or custom Anchor DEX) on DevNet was rejected due to unnecessary friction and deployment fragility within a 48-hour hackathon window.

## Decision
We select **Option A: Centralized Market Maker Vault with 2-Instruction Atomic SPL Transfers**.
- A server keypair acts as the Game Treasury / Liquidity Provider on DevNet.
- When an Asset Swap triggers, an atomic transaction is constructed with:
  1. `createTransferCheckedInstruction` (Player Session -> Treasury for sold asset)
  2. `createTransferCheckedInstruction` (Treasury -> Player Session for bought asset)
- Both instructions execute and settle in the exact same Solana slot (~400ms). If either instruction fails, the entire transaction reverts.

## Consequences
### Positive
- **Atomic Execution:** Zero counterparty risk; tokens are exchanged simultaneously in a single transaction.
- **Genuine On-Chain SPL Tokens:** Uses standard SPL Token program primitives verifiable on Solana Explorer.
- **Fixed Supply Realism:** Avoids artificial infinite minting/burning that could distort game token economics.
- **Rapid 48-Hour Implementation:** No custom Anchor program deployment needed; uses battle-tested `@solana/spl-token` and `@solana/web3.js` libraries.

### Negative / Trade-offs
- The server Treasury keypair must be pre-seeded with initial liquidity for $IRON, $WOOD, and $GOLD.
