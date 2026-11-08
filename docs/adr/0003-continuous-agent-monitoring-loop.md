
# ADR-0003: Continuous Agent Monitoring Loop with Telemetry Logging

## Context
When a Player submits a natural language Trading Strategy (such as "Trade Iron for Gold if Gold drops below 10 Iron"), market prices rarely match the target threshold at the exact millisecond of form submission.

If the backend evaluates the strategy only once upon submission (Single-Shot), the request finishes immediately with "Conditions not met", leaving the user to repeatedly re-submit the strategy manually. This breaks the autonomous agent proposition.

## Decision
We implement a **Continuous Monitoring Loop with Real-Time Telemetry Streaming**:
1. When a Trading Strategy is submitted, the Autonomous Agent enters an **ACTIVE / MONITORING** state in the dashboard.
2. The agent continuously receives Market price ticks (every 5 seconds) alongside Player Inventory updates.
3. The LLM (Mastra + Groq Llama 3.1 8B) evaluates the current market state against the strategy directives and outputs structured telemetry logs (e.g. `[14:02:10] Gold at 11.4 Iron. Target < 10.0. Holding position.`).
4. As soon as the price fluctuation satisfies the strategy criteria, the agent triggers the on-chain swap tool, broadcasts the transaction, confirms receipt, and reports the Solana Explorer transaction signature in the telemetry stream.
5. The player can pause, stop, or update the strategy at any time via the terminal UI.

## Consequences
### Positive
- **Dramatic Hackathon Demo Appeal:** The terminal interface actively displays the agent's thought process, price evaluations, and autonomous execution live on screen.
- **True Set-and-Forget Experience:** Fulfills the core promise of an AI economist working on behalf of the player.
- **Low Latency:** Leveraging Groq's high-speed inference engine ensures evaluation takes <300ms per tick.

### Negative / Trade-offs
- Requires structured client-server state coordination (SSE or client tick evaluation orchestrating Mastra route).
