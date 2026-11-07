---
status: accepted
date: 2026-11-06
decision-makers: [Developer, AI Architect]
---

# ADR-0001: Autonomous Execution and Session Key Custody Model

## Context
AutoLoot requires an AI agent to execute token swaps autonomously based on natural-language player directives (e.g. "Sell Wood if price exceeds 5 Gold"). In a standard Web3 application with browser wallets (such as Phantom), every on-chain transaction requires interactive user approval via a wallet popup. If the agent must trigger a wallet signature for every automated trade, true background autonomy is broken, interrupting gameplay and degrading the user experience.

On Solana DevNet, real funds are not at stake, allowing for dedicated session delegation patterns.

## Decision
We adopt the **Session Keypair (Burner Hot-Wallet)** model:
1. The Player connects their primary wallet (Phantom) for identity and inventory inspection.
2. The client application generates or assigns a dedicated DevNet Session Keypair specifically for the AutoLoot Autonomous Agent.
3. The Player can fund or airdrop DevNet SOL and initial test assets into the session account with a single faucet interaction.
4. The Mastra AI agent backend uses this Session Keypair to sign and broadcast atomic asset swaps directly to Solana DevNet with zero interactive wallet popups.

## Consequences
### Positive
- **True Background Autonomy:** The AI agent executes swaps automatically whenever market conditions are met without user intervention.
- **Hackathon Demo Impact:** Live streaming trades execute and confirm on-chain in real time (<1s) during demos without UI freezing or modal interruptions.
- **Clear Security Boundary:** Session keys are strictly DevNet keys with zero exposure to the player's mainnet assets.

### Negative / Trade-offs
- Requires an initial airdrop/transfer step to seed the session wallet with test tokens.
- For a future mainnet production release, this would require transition to session key smart contracts (e.g., Solana Session Keys / delegated authority programs).
