import { Agent } from '@mastra/core/agent';
import { getInventoryTool, getMarketPricesTool, executeAtomicSwapTool, performAtomicSwap, SwapResult } from './agent-tools';
import { getCurrentMarketPrices } from './market-engine';
import { getPlayerInventory } from './player-inventory';
import Groq from 'groq-sdk';

const SYSTEM_INSTRUCTIONS = `
You are AUTOLOOT-PRIME, an autonomous AI in-game economist deployed on the Solana DevNet blockchain.
Your mission is to monitor real-time in-game market rates against a Player's declared natural language trading strategy and execute atomic SPL token swaps when target thresholds are satisfied.

ASSETS UNDER MANAGEMENT:
- $WOOD (Raw Timber - construction commodity)
- $IRON (Refined Iron Ore - industrial metal)
- $GOLD (Pure Gold Bullion - high-tier reserve asset)

OPERATIONAL PROTOCOL:
1. RIGOROUS MATHEMATICAL EVALUATION:
   - Carefully parse the user's strategy condition (e.g. "Trade my Iron for Gold if Gold drops below 10 Iron", "Sell Wood if Wood exceeds 3 Iron").
   - Compare the current market cross-rates or asset prices precisely against the target threshold.
2. EXECUTION CRITERIA:
   - If the condition is MET:
     - Check the player's inventory to verify they possess the asset being sold.
     - Call the \`executeAtomicSwap\` tool with the appropriate \`walletAddress\`, \`fromAsset\`, \`toAsset\`, \`amountIn\`, and a clear economic \`reason\`.
   - If the condition is NOT MET:
     - DO NOT call \`executeAtomicSwap\`.
     - Output an analytical status telemetry explaining the current rate vs target threshold, and state that you are HOLDING position.
   - If the player has INSUFFICIENT BALANCE:
     - DO NOT execute. Report insufficient inventory.
3. OUTPUT FORMAT:
   - Always speak in a sharp, futuristic exchange terminal telemetry style.
   - Mention the current market tick, prices, exact condition evaluated, and final action (SWAP or HOLD).
`;

export function createAutoLootAgent(groqApiKey?: string) {
  const apiKey = groqApiKey || process.env.GROQ_API_KEY;

  return new Agent({
    id: 'autoloot-economist',
    name: 'AutoLoot-Economist',
    instructions: SYSTEM_INSTRUCTIONS,
    model: {
      id: 'groq/llama-3.3-70b-versatile',
      apiKey,
    },
    tools: {
      getInventory: getInventoryTool,
      getMarketPrices: getMarketPricesTool,
      executeAtomicSwap: executeAtomicSwapTool,
    },
  });
}

/**
 * Fallback heuristic evaluator for zero-latency deterministic execution
 * or when GROQ_API_KEY is absent during offline test environments.
 */
export async function evaluateStrategyDeterministic(params: {
  strategy: string;
  walletAddress: string;
}): Promise<{
  decision: 'SWAP' | 'HOLD' | 'INSUFFICIENT_FUNDS';
  thoughtLog: string;
  executed: boolean;
  swapResult?: SwapResult;
}> {
  const { strategy, walletAddress } = params;
  const market = getCurrentMarketPrices();
  const inventory = getPlayerInventory(walletAddress);

  const lower = strategy.toLowerCase();

  // Pattern 1: "Trade Iron for Gold if Gold drops below X Iron"
  const goldBelowIronMatch = lower.match(/(?:gold).*(?:below|under|drops below|<)\s*(\d+(?:\.\d+)?)/);
  if (lower.includes('iron') && lower.includes('gold') && goldBelowIronMatch) {
    const targetThreshold = parseFloat(goldBelowIronMatch[1]);
    const currentIronPerGold = market.crossRates.IRON_PER_GOLD;

    if (currentIronPerGold <= targetThreshold) {
      const amountToSell = Math.min(inventory.IRON, 50);
      if (amountToSell <= 0) {
        return {
          decision: 'INSUFFICIENT_FUNDS',
          thoughtLog: `[TELEMETRY] Target satisfied (Gold at ${currentIronPerGold} Iron <= ${targetThreshold}), but Player has 0 $IRON in inventory. Standing by.`,
          executed: false,
        };
      }

      const swapResult = performAtomicSwap({
        walletAddress,
        fromAsset: 'IRON',
        toAsset: 'GOLD',
        amountIn: amountToSell,
        reason: `Target hit: 1 Gold costs ${currentIronPerGold} Iron (Threshold: <= ${targetThreshold}). Swapped ${amountToSell} $IRON.`,
      });

      return {
        decision: 'SWAP',
        thoughtLog: `[EXECUTION TELEMETRY] Target satisfied! Gold is at ${currentIronPerGold} Iron (target <= ${targetThreshold}). Executing atomic swap: ${amountToSell} $IRON -> ${swapResult.amountOut} $GOLD on Solana DevNet. Tx: ${swapResult.txSignature?.slice(0, 8)}...`,
        executed: true,
        swapResult,
      };
    } else {
      return {
        decision: 'HOLD',
        thoughtLog: `[MONITORING TICK #${market.tick}] Target condition not yet met: 1 Gold currently costs ${currentIronPerGold} Iron (Target: <= ${targetThreshold}). Holding position.`,
        executed: false,
      };
    }
  }

  // Pattern 2: "Sell Wood for Iron if Iron drops below X Wood"
  const ironBelowWoodMatch = lower.match(/(?:iron).*(?:below|under|drops below|<)\s*(\d+(?:\.\d+)?)/);
  if (lower.includes('wood') && lower.includes('iron') && ironBelowWoodMatch) {
    const targetThreshold = parseFloat(ironBelowWoodMatch[1]);
    const currentWoodPerIron = market.crossRates.WOOD_PER_IRON;

    if (currentWoodPerIron <= targetThreshold) {
      const amountToSell = Math.min(inventory.WOOD, 100);
      if (amountToSell <= 0) {
        return {
          decision: 'INSUFFICIENT_FUNDS',
          thoughtLog: `[TELEMETRY] Target satisfied (Iron at ${currentWoodPerIron} Wood <= ${targetThreshold}), but Player has 0 $WOOD. Standing by.`,
          executed: false,
        };
      }

      const swapResult = performAtomicSwap({
        walletAddress,
        fromAsset: 'WOOD',
        toAsset: 'IRON',
        amountIn: amountToSell,
        reason: `Target hit: 1 Iron costs ${currentWoodPerIron} Wood (Threshold: <= ${targetThreshold}). Swapped ${amountToSell} $WOOD.`,
      });

      return {
        decision: 'SWAP',
        thoughtLog: `[EXECUTION TELEMETRY] Target satisfied! Iron is at ${currentWoodPerIron} Wood (target <= ${targetThreshold}). Executing atomic swap: ${amountToSell} $WOOD -> ${swapResult.amountOut} $IRON on Solana DevNet.`,
        executed: true,
        swapResult,
      };
    } else {
      return {
        decision: 'HOLD',
        thoughtLog: `[MONITORING TICK #${market.tick}] Target condition not yet met: 1 Iron currently costs ${currentWoodPerIron} Wood (Target: <= ${targetThreshold}). Holding position.`,
        executed: false,
      };
    }
  }

  // Default passive scan
  return {
    decision: 'HOLD',
    thoughtLog: `[ANALYSIS TICK #${market.tick}] Strategy registered: "${strategy}". Prevailing market rates: 1 Gold = ${market.crossRates.IRON_PER_GOLD} Iron, 1 Iron = ${market.crossRates.WOOD_PER_IRON} Wood. Monitoring next market tick.`,
    executed: false,
  };
}

/**
 * Primary Strategy Runner
 * Tries LLM via Groq + Mastra, with seamless heuristic fallback
 */
export async function runAgentStrategy(params: {
  strategy: string;
  walletAddress: string;
  groqApiKey?: string;
}): Promise<{
  decision: 'SWAP' | 'HOLD' | 'INSUFFICIENT_FUNDS';
  thoughtLog: string;
  executed: boolean;
  swapResult?: SwapResult;
  inventory: { IRON: number; WOOD: number; GOLD: number };
}> {
  const apiKey = params.groqApiKey || process.env.GROQ_API_KEY;

  if (apiKey) {
    try {
      const groq = new Groq({ apiKey });
      const market = getCurrentMarketPrices();
      const inventory = getPlayerInventory(params.walletAddress);

      const prompt = `
CURRENT TICK: #${market.tick}
MARKET PRICES:
- $WOOD: ${market.assets.WOOD.price} Credits
- $IRON: ${market.assets.IRON.price} Credits
- $GOLD: ${market.assets.GOLD.price} Credits

CROSS RATES:
- 1 GOLD = ${market.crossRates.IRON_PER_GOLD} IRON
- 1 IRON = ${market.crossRates.WOOD_PER_IRON} WOOD
- 1 GOLD = ${market.crossRates.WOOD_PER_GOLD} WOOD

PLAYER INVENTORY (Wallet: ${params.walletAddress}):
- $WOOD: ${inventory.WOOD}
- $IRON: ${inventory.IRON}
- $GOLD: ${inventory.GOLD}

PLAYER STRATEGY:
"${params.strategy}"

Evaluate the strategy mathematically. If conditions are met and player has balance, execute the atomic swap. Output your telemetry reasoning.
`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTIONS },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });

      const responseText = completion.choices[0]?.message?.content || '';

      if (
        (responseText.toLowerCase().includes('executing atomic swap') ||
          responseText.toLowerCase().includes('execute swap') ||
          responseText.toLowerCase().includes('condition is met') ||
          responseText.toLowerCase().includes('threshold reached')) &&
        !responseText.toLowerCase().includes('not met')
      ) {
        const execResult = await evaluateStrategyDeterministic(params);
        return {
          decision: execResult.decision,
          thoughtLog: responseText,
          executed: execResult.executed,
          swapResult: execResult.swapResult,
          inventory: getPlayerInventory(params.walletAddress),
        };
      }

      return {
        decision: 'HOLD',
        thoughtLog: responseText,
        executed: false,
        inventory: getPlayerInventory(params.walletAddress),
      };
    } catch (llmError: any) {
      console.warn('Groq LLM call failed, falling back to deterministic evaluation:', llmError?.message);
    }
  }

  // Fallback to deterministic parser
  const result = await evaluateStrategyDeterministic(params);
  return {
    ...result,
    inventory: getPlayerInventory(params.walletAddress),
  };
}
