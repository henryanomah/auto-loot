# Domain Glossary: AutoLoot

Ubiquitous language and canonical terminology for the AutoLoot autonomous in-game economy.

---

### Player
An authenticated participant in the game ecosystem who holds self-custodial ownership of in-game tokenized assets via a public cryptographic wallet.
_Avoid_: User, Client, Account, Gamer

### In-Game Asset
A scarce, fungible commodity (specifically $IRON, $WOOD, or $GOLD) representing in-game resources that exist as verifiable tokens on the blockchain.
_Avoid_: Coin, Item, Resource, Material

### Player Inventory
The aggregate on-chain token balance held directly within a Player's active wallet or session custody.
_Avoid_: Stash, Bag, Wallet Balance, Portfolio

### Session Keypair
A temporary, cryptographically isolated DevNet keypair generated for an active play session to allow an Autonomous Agent to sign and broadcast on-chain transactions without interactive wallet popups.
_Avoid_: Burner Wallet, Hot Key, Private Key, Fake Wallet

### Treasury Vault
A designated on-chain authority holding circulating reserves of In-Game Assets to act as the counterparty in simulated Market exchanges.
_Avoid_: Bank, Central Reserve, Admin Account, Liquidity Pool

### Market
The economic environment where exchange rates between In-Game Assets fluctuate dynamically based on simulated player supply and demand.
_Avoid_: Exchange, DEX, Store, Shop

### Market Tick
A discrete periodic update to the prevailing exchange rates of In-Game Assets in the Market.
_Avoid_: Price Ping, Refresh, Timer, Epoch

### Trading Strategy
A natural-language declaration composed by a Player expressing economic goals, target price thresholds, and asset reallocation rules.
_Avoid_: Prompt, Trading Rule, Bot Config, Command

### Autonomous Agent
The autonomous economic proxy that monitors the Market against a Player's Trading Strategy and executes asset reallocations when conditions are satisfied.
_Avoid_: Bot, Mastra Engine, LLM Worker, Script

### Monitoring Loop
The continuous operational cycle wherein the Autonomous Agent evaluates successive Market Ticks against active Trading Strategies.
_Avoid_: Polling Interval, Background Job, Cron, Poller

### Telemetry Stream
The real-time log of thoughts, evaluations, market comparisons, and transaction signatures emitted by the Autonomous Agent to the terminal.
_Avoid_: Console Log, Output, Debug Log, Chat History

### Asset Swap
The atomic exchange of one In-Game Asset for another at the prevailing Market exchange rate via simultaneous dual-transfer instructions.
_Avoid_: Trade, Transaction, Purchase, Transfer
