'use server';

/**
 * @fileOverview This file defines the Genkit flow for the AI opponent in the CHEGG game.
 * It enables the AI to analyze the current game state and strategize minion spawning,
 * movement, and attacks according to game rules.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Minion Master List ---
const MINION_MASTER_LIST_DATA = [
  { "minion": "Villager", "cost": 0, "movementPattern": "8 surrounding squares", "attackPattern": "None", "specialAbilities": "King: Losing this unit ends the game. Cannot attack. First move costs 1 Mana; Dash costs 2." },
  { "minion": "Zombie", "cost": 1, "movementPattern": "3 squares forward only", "attackPattern": "4 lateral directions", "specialAbilities": "Basic unit." },
  { "minion": "Creeper", "cost": 1, "movementPattern": "8 surrounding squares", "attackPattern": "8 surrounding squares", "specialAbilities": "Detonate: Attack destroys everything in range and eliminates the Creeper." },
  { "minion": "Pig", "cost": 1, "movementPattern": "8 surrounding squares", "attackPattern": "None", "specialAbilities": "Hoarder: Draw 1 minion on spawn and 1 on death." },
  { "minion": "Rabbit", "cost": 2, "movementPattern": "2-tile lateral 'hop'", "attackPattern": "None", "specialAbilities": "Lucky Foot: Draw 1 minion if it jumps over any unit during its move." },
  { "minion": "Puffer-Fish", "cost": 2, "movementPattern": "4 lateral directions", "attackPattern": "4 diagonal squares", "specialAbilities": "Spikes: Hits all 4 diagonal squares simultaneously." },
  { "minion": "Iron Golem", "cost": 2, "movementPattern": "8 surrounding squares", "attackPattern": "3 adjacent lateral tiles", "specialAbilities": "Sweep: Hits all 3 targeted tiles at once in a lateral direction." },
  { "minion": "Frog", "cost": 2, "movementPattern": "Lateral: 2, Diagonal: 1", "attackPattern": "None", "specialAbilities": "Tongue Pull (1 Mana): Pulls a unit in a lateral line 2 squares closer." },
  { "minion": "Skeleton", "cost": 3, "movementPattern": "4 lateral directions", "attackPattern": "3-tile diagonal range", "specialAbilities": "Ranged: Hits targets up to 3 tiles away diagonally." },
  { "minion": "Blaze", "cost": 3, "movementPattern": "4 diagonal directions", "attackPattern": "2-tile lateral range", "specialAbilities": "Ranged: Hits targets up to 2 tiles away laterally." },
  { "minion": "Phantom", "cost": 3, "movementPattern": "8 surrounding squares (Range 2)", "attackPattern": "8 surrounding squares", "specialAbilities": "Ethereal: Can only spawn, move, or attack on dark tiles." },
  { "minion": "Enderman", "cost": 4, "movementPattern": "Cannot move", "attackPattern": "8 surrounding squares", "specialAbilities": "Teleport (1 Mana): Swap places with any unit (except Villager) in a lateral line." },
  { "minion": "Slime", "cost": 4, "movementPattern": "8 surrounding squares (Range 2)", "attackPattern": "Move-to-attack", "specialAbilities": "Elastic: Can jump over pieces. Attacks the tile it lands on (Cost: 1 Mana)." },
  { "minion": "Shulker-Box", "cost": 4, "movementPattern": "Attack-move only", "attackPattern": "Ranged (Line of Sight)", "specialAbilities": "Kinetic: Only moves by 'teleporting' to the tile of a unit it attacks." },
  { "minion": "Parrot", "cost": 5, "movementPattern": "8 surrounding squares", "attackPattern": "Variable", "specialAbilities": "Mimic: Copies the attack pattern of any laterally adjacent minion." },
  { "minion": "Cat", "cost": 5, "movementPattern": "Cannot move", "attackPattern": "None", "specialAbilities": "Feline Grace: Grants owner +1 Mana per turn (Stacks)." },
  { "minion": "Sniffer", "cost": 5, "movementPattern": "8 surrounding squares", "attackPattern": "None", "specialAbilities": "Scent: Spawn: Draw 2 from enemy deck; Death: Discard 2 from your hand." },
  { "minion": "Wither", "cost": 6, "movementPattern": "8 surrounding squares", "attackPattern": "3-tile lateral projectile", "specialAbilities": "Storm: Spawn: Destroys surrounding 8 squares. Attack (2 Mana): Hits target + lateral splash." }
];
const MINION_MASTER_LIST_JSON = JSON.stringify(MINION_MASTER_LIST_DATA, null, 2);

// --- Input Schema: GameState ---
const BoardCellSchema = z.object({
  x: z.number().int().min(0).max(7),
  y: z.number().int().min(0).max(9),
  minion: z.union([
    z.object({
      id: z.string().describe('Unique ID for this minion instance.'),
      type: z.string().describe('Minion type, e.g., "Villager", "Zombie".'),
      owner: z.enum(['Red', 'Blue']),
      isVillager: z.boolean().describe('True if this minion is a Villager (King).'),
      currentHealth: z.number().int().min(0).optional().describe('Current health of the minion if applicable.'),
      hasSpawnSickness: z.boolean().describe('True if minion cannot act this turn.'),
      hasAttackedThisTurn: z.boolean().describe('True if minion has attacked this turn.'),
      hasMovedThisTurn: z.boolean().describe('True if minion has moved this turn.'),
      hasDashedThisTurn: z.boolean().describe('True if minion has dashed this turn.'),
    }),
    z.null(),
  ]).nullable().describe('Details of the minion on this cell, or null if empty.'),
  isDarkTile: z.boolean().describe('True if this tile is considered "dark" for Phantom abilities.'),
}).describe('A cell on the game board.');

const GameStateSchema = z.object({
  currentPlayer: z.enum(['Red', 'Blue']).describe('The player whose turn it is.'),
  opponentPlayer: z.enum(['Red', 'Blue']).describe('The opponent player.'),
  currentMana: z.number().int().min(0).describe('Current mana available.'),
  maxManaCapacity: z.number().int().min(1).max(6).describe('Maximum mana capacity.'),
  playerHand: z.array(z.string()).describe('Minion types available in hand.'),
  board: z.array(z.array(BoardCellSchema)).length(10).describe('The 10x8 game board.'),
}).describe('The complete current state of the game.');

export type GameState = z.infer<typeof GameStateSchema>;

// --- Output Schema: AIActions ---
const AIActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('attack'), minionId: z.string(), targetPosition: z.object({ x: z.number().int(), y: z.number().int() }) }),
  z.object({ type: z.literal('move'), minionId: z.string(), targetPosition: z.object({ x: z.number().int(), y: z.number().int() }) }),
  z.object({ type: z.literal('dash'), minionId: z.string(), targetPosition: z.object({ x: z.number().int(), y: z.number().int() }) }),
  z.object({ type: z.literal('spawn'), minionType: z.string(), position: z.object({ x: z.number().int(), y: z.number().int() }) }),
  z.object({ type: z.literal('useAbility'), minionId: z.string(), abilityName: z.string(), targetPosition: z.object({ x: z.number().int(), y: z.number().int() }).optional(), targetMinionId: z.string().optional() }),
  z.object({ type: z.literal('endTurn') }),
]);

const AIActionsSchema = z.object({
  actions: z.array(AIActionSchema).describe('A sequence of strategic actions.'),
  reasoning: z.string().describe('The strategic reasoning.'),
});

export type AIActions = z.infer<typeof AIActionsSchema>;

const aiOpponentPrompt = ai.definePrompt({
  name: 'cheggOpponentStrategy',
  input: { schema: GameStateSchema },
  output: { schema: AIActionsSchema },
  prompt: `Analyze the CHEGG game state and decide the best move. Zombie cost is 1. Villager is the King.
  
  Minion List:
  ${MINION_MASTER_LIST_JSON}
  
  Current State:
  {{{json this}}}`,
});

export async function aiOpponentGameplay(input: GameState): Promise<AIActions> {
  const { output } = await aiOpponentPrompt(input);
  return output!;
}
