# AutoLoot — Technical Architecture & Security Model

> **Deep-Dive Engineering Documentation**  
> *Solana DevNet Settlement, AI Agent Reasoning, and Zero-Popup Session Execution*

---

## 1. High-Level System Architecture

AutoLoot separates high-frequency autonomous trading loops from user wallet custody to solve the fundamental UX problem in Web3 gaming: **eliminating intrusive browser wallet popups during automated background execution while preserving verifiable on-chain settlement**.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser Layer                    │
│                                                             │
│   ┌────────────────────┐         ┌──────────────────────┐   │
│   │   Phantom Wallet   │         │ Next.js App Router   │   │
│   │   (Manual Action:  │         │ (Autonomous Monitor, │   │
│   │    Depot Purchases)│         │  Tick Stream & UI)   │   │
│   └─────────┬──────────┘         └──────────┬───────────┘   │
└─────────────┼───────────────────────────────┼───────────────┘
              │ Direct Manual Sign            │ HTTP POST /api/agent
              ▼                               ▼
┌─────────────────────────┐       ┌───────────────────────────┐
│   Solana DevNet Cluster │       │  AutoLoot Backend Core    │
│                         │       │                           │
│  - Memo Program         │◄──────┤  1. Mastra AI Framework   │
│  - Protocol Keypair     │ On-   │  2. Groq Llama 3.1 8B     │
│  - Verifiable Ledgers   │ Chain │  3. Failsafe Risk Rails   │
│                         │ Memo  │  4. Solana Settlement     │
└─────────────────────────┘       └───────────────────────────┘
```

---

## 2. Zero-Popup Settlement Model (ADR-0001 & ADR-0002)

### The Challenge:
Browser extensions (Phantom, Solflare) strictly enforce user presence on every transaction. They intentionally block silent background signing to prevent unauthorized wallet draining.

If an autonomous agent triggers trades every 5–10 seconds in the background, a user would receive constant browser popups, making gameplay impossible.

### The AutoLoot Solution:
AutoLoot employs a dual-tier transaction model:
1. **Manual Player Actions (Tier 1):**
   - Interacting with the **Resource Depot** to purchase in-game commodities with DevNet SOL directly triggers Phantom, requiring explicit user authorization.
2. **Autonomous Background Swaps (Tier 2):**
   - When the autonomous agent evaluates market ticks in the background, swaps are routed through the server-side **Solana Settlement Engine** ([`solana-settlement.ts`](file:///home/hayax/solana/auto-loot/app/lib/solana-settlement.ts)).
   - The engine utilizes a funded protocol keypair (`id.json` on Solana DevNet) to sign and broadcast verifiable transactions using the Solana Memo program.
   - Every trade produces a valid Solana transaction hash, slot number, and block confirmation recorded in the client's verified trade ledger.

---

## 3. AI Agent Architecture (Mastra + Groq)

### 1. Natural Language Directive Parsing
Players write directives in natural language:
- *"Trade 30 Iron for Gold if Gold drops below 10.0 Iron"*
- *"Sell 50 Wood for Iron if Iron drops below 3.0 Wood"*

### 2. Multi-Tier Evaluation:
1. **Tier A (LLM Reasoning via Groq):**
   - The directive, current market prices, tick index, cross-rates, and player inventory balances are passed to Groq running `llama-3.1-8b-instant` (with optional model override via `GROQ_MODEL`).
   - The model mathematically validates the condition against the cross-rate matrix and decides whether to emit a `SWAP` or `HOLD` decision.
2. **Tier B (Zero-Latency Deterministic Heuristic Fallback):**
   - If the LLM provider experiences latency spikes or network timeouts, the system falls back to a deterministic regex parser and mathematical cross-rate comparator ([`mastra-agent.ts`](file:///home/hayax/solana/auto-loot/app/lib/mastra-agent.ts)).
   - This guarantees that market opportunities are never missed due to upstream LLM downtime.

---

## 4. Emergency Failsafe Rails & Risk Management

AutoLoot implements rigorous risk controls to protect player inventories:

| Rail | Mechanism | Default Setting | Trigger Action |
| :--- | :--- | :--- | :--- |
| **Max Drawdown Stop-Loss** | Real-time monitoring of session PnL percentage vs baseline | `-15%` | Automatically stops the background polling loop, logs warning, dispatches UI alert. |
| **Reserve Floor Guard** | Pre-flight balance check before atomic swaps | `10 Units` | Rejects trade if executing would leave commodity inventory below floor. |
| **Circuit Breaker** | Manual one-click killswitch | Active in UI | Instantly halts all background monitoring with zero network latency. |

---

## 5. Security Model & Best Practices

1. **Sandboxed Keypair Scope:** The protocol settlement keypair only pays transaction network fees (0.00001 SOL per swap) and signs Memo proofs; it never has withdrawal custody over external player wallets.
2. **Deterministic Balances:** Inventory state updates are atomic: deductions from the source commodity and additions to the destination commodity occur in a single execution step.
3. **No Private Keys in Client Bundles:** All cryptographic keys remain strictly on the server-side runtime; the frontend only interacts with public addresses and signatures.
