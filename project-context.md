Act as an expert full-stack Web3, AI, and frontend developer. We are building "AutoLoot" (an AI-Managed In-Game Economist) for a 48-hour Solana Hackathon. The goal is to build a Next.js application where an AI agent autonomously manages a player's in-game assets by trading them on a simulated market. This project proves that when players truly own the items they earn in a game, they can use AI to optimize their inventory.

Strict Tech Stack Requirements

Framework: Next.js (App Router).

UI/Design System: Tailwind CSS + shadcn/ui. The UI must have a high sci-fi, futuristic exchange terminal aesthetic. Use dark mode by default, monospace fonts for numbers, sharp UI corners, and neon glowing accents (like cyan or neon green) for interactive elements and charts.

Web3 Foundation: Scaffold the UI using one of the official Solana Developer Templates to get the wallet connection boilerplate out of the box. We will be deploying on the DevNet.

AI Agent Framework: Mastra.

LLM Provider: Groq API (using Llama 3).

Blockchain Actions: Integrate the provided "Solana Agent Skills" as function-calling tools for the AI agent to let it work with Solana programs, tokens, and tooling.

Secrets Management: Use standard .env.local files for development. The required variable is GROQ_API_KEY. (I will manually add this key to the Vercel environment variables during deployment).

Phase 1: Mock Market Engine (Backend)
Since we are not connecting to a live multiplayer game, build a mock market API.

Create an API route (/api/market-prices) that returns simulated exchange rates for three DevNet tokens: $IRON, $WOOD, and $GOLD.

Write a lightweight randomization logic that fluctuates the prices of these three assets slightly every time the endpoint is called to simulate a live, player-driven economy.

Phase 2: The AI Agent Route (Backend)
Create a single API route (/api/agent) to house the Mastra AI agent.

Initialize Mastra and configure it to use the Groq provider, fetching the key from the environment.

Import the pre-built Solana Agent Skills and bind them to the Mastra agent as executable tools.

The route must accept a POST request containing the user's natural language trading strategy (e.g., "Trade my Iron for Gold if Gold drops below 10 Iron") and the user's wallet address.

Inside the route, fetch the current prices from /api/market-prices. Pass the current prices, the user's strategy, and the wallet state to the Mastra/Groq agent.

Instruct the LLM to evaluate the market conditions against the strategy and execute a token swap using the Solana tools if the conditions are met.

Phase 3: The Sci-Fi Dashboard (Frontend)
Build a single-page Next.js dashboard acting as the user's terminal.

Wallet Integration: A connect button allowing users to link their Phantom wallet.

Live Market Chart: A component that polls /api/market-prices every 5 seconds and displays the shifting token prices in a futuristic telemetry style.

Inventory State: A component that reads the user's connected wallet and displays their current $IRON, $WOOD, and $GOLD balances.

Agent Control Center: A command-line style text input form where the user types their trading strategy. Upon submission, this posts to /api/agent.

Emphasize fast UI updates; because Solana transactions settle in about a second, the inventory balances should refresh immediately after the agent executes a successful trade.

Execution Instructions:
Do not write the entire application in one response. Acknowledge this architecture, confirm you understand the Sci-Fi UI design constraint, and provide the terminal commands (specifically tailored for a WSL environment) to initialize the Next.js Solana Developer Template, setup shadcn/ui, and install the necessary dependencies (Mastra, Groq). Wait for my confirmation before writing the Phase 1 code.