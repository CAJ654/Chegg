'use server';

/**
 * @fileOverview This file defines the Genkit flow for the AI opponent in the CHEGG game.
 * It enables the AI to analyze the current game state and strategize minion spawning,
 * movement, and attacks according to game rules.
 *
 * - aiOpponentGameplay - The main function to trigger the AI's turn.
 * - GameState - The input type for the AI.
 * - AIActions - The output type for the AI's chosen actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Minion Master List ---
const MINION_MASTER_LIST_DATA = [
  { "minion": "Villager", "cost": 0, "movementPattern": "8 surrounding squares", "attackPattern": "8 surrounding squares", "specialAbilities": "King: Losing this unit ends the game. First move costs 1 Mana; Dash costs 2." },
  { "minion": "Zombie", "cost": 1, "movementPattern": "3 squares forward only", "attackPattern": "4 lateral directions", "specialAbilities": "Basic unit." },
  { "minion": "Creeper", "cost": 1, "movementPattern": "8 surrounding squares", "attackPattern": "8 surrounding squares", "specialAbilities": "Detonate: Attack destroys everything in range and eliminates the Creeper." },
  { "minion": "Pig", "cost": 1, "movementPattern": "8 surrounding squares", "attackPattern": "None", "specialAbilities": "Hoarder: Draw 1 minion on spawn and 1 on death." },
  { "minion": "Rabbit", "cost": 2, "movementPattern": "2-tile lateral 'hop'", "attackPattern": "None", "specialAbilities": "Lucky Foot: Draw 1 minion if it jumps over any unit during its move." },
  { "minion": "Puffer-Fish", "cost": 2, "movementPattern": "4 lateral directions", "attackPattern": "4 diagonal squares", "specialAbilities": "Spikes: Hits all 4 diagonal squares simultaneously." },
  { "minion": "Iron Golem", "cost": 2, "movementPattern": "8 surrounding squares", "attackPattern": "3 adjacent lateral tiles", "specialAbilities": "Sweep: Hits all 3 targeted tiles at once in a lateral direction." },
  { "minion": "Frog", "cost": 2, "movementPattern": "8 surrounding squares", "attackPattern": "None", "specialAbilities": "Tongue Pull (1 Mana): Pulls a unit in a lateral line 2 squares closer." },
  { "minion": "Skeleton", "cost": 3, "movementPattern": "4 lateral directions", "attackPattern": "3-tile diagonal range", "specialAbilities": "Ranged: Hits targets up to 3 tiles away diagonally." },
  { "minion": "Blaze", "cost": 3, "movementPattern": "4 diagonal directions", "attackPattern": "2-tile lateral range", "specialAbilities": "Ranged: Hits targets up to 2 tiles away laterally." },
  { "minion": "Phantom", "cost": 3, "movementPattern": "8 surrounding squares", "attackPattern": "8 surrounding squares", "specialAbilities": "Ethereal: Can only spawn, move, or attack on dark tiles." },
  { "minion": "Enderman", "cost": 4, "movementPattern": "Cannot move", "attackPattern": "8 surrounding squares", "specialAbilities": "Teleport (1 Mana): Swap places with any unit (except Villager) in a lateral line." },
  { "minion": "Slime", "cost": 4, "movementPattern": "8 surrounding squares", "attackPattern": "Move-to-attack", "specialAbilities": "Elastic: Can jump over pieces. Attacks the tile it lands on (Cost: 1 Mana)." },
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
      currentHealth: z.number().int().min(0).optional().describe('Current health of the minion if applicable (assume 1 if not specified and minion is eliminated on hit).'),
      hasSpawnSickness: z.boolean().describe('True if minion cannot act this turn.'),
      hasAttackedThisTurn: z.boolean().describe('True if minion has attacked this turn.'),
      hasMovedThisTurn: z.boolean().describe('True if minion has moved this turn (including dash).'),
      hasDashedThisTurn: z.boolean().describe('True if minion has dashed this turn.'),
    }),
    z.null(),
  ]).nullable().describe('Details of the minion on this cell, or null if empty.'),
  isDarkTile: z.boolean().describe('True if this tile is considered "dark" for Phantom abilities.'),
}).describe('A cell on the game board.');

const GameStateSchema = z.object({
  currentPlayer: z.enum(['Red', 'Blue']).describe('The player whose turn it is (AI player).'),
  opponentPlayer: z.enum(['Red', 'Blue']).describe('The opponent player.'),
  currentMana: z.number().int().min(0).describe('Current mana available to the AI player.'),
  maxManaCapacity: z.number().int().min(1).max(6).describe('Maximum mana capacity for the current turn.'),
  playerHand: z.array(z.string()).describe('Minion types available in the AI player\'s hand.'),
  board: z.array(z.array(BoardCellSchema)).length(10).describe('The 10x8 game board (board[row][col]).'), // 10 rows, each with 8 columns
}).describe('The complete current state of the CHEGG game.');

export type GameState = z.infer<typeof GameStateSchema>;

// --- Output Schema: AIActions ---
const AIAttackActionSchema = z.object({
  type: z.literal('attack'),
  minionId: z.string().describe('ID of the attacking minion.'),
  targetPosition: z.object({ x: z.number().int(), y: z.number().int() }).describe('Target position of the attack (the square containing the target minion).'),
}).describe('An action to attack with a minion.');

const AIMoveActionSchema = z.object({
  type: z.literal('move'),
  minionId: z.string().describe('ID of the minion to move.'),
  targetPosition: z.object({ x: z.number().int(), y: z.number().int() }).describe('Target position for the move.'),
}).describe('An action to move a minion (free move).');

const AIDashActionSchema = z.object({
  type: z.literal('dash'),
  minionId: z.string().describe('ID of the minion to dash.'),
  targetPosition: z.object({ x: z.number().int(), y: z.number().int() }).describe('Target position for the dash.'),
}).describe('An action to dash a minion (costs 1 Mana, 2 for Villager).');

const AISpawnActionSchema = z.object({
  type: z.literal('spawn'),
  minionType: z.string().describe('Type of minion to spawn (must be from playerHand).'),
  position: z.object({ x: z.number().int(), y: z.number().int() }).describe('Position to spawn the minion within the player\'s spawn zone.'),
}).describe('An action to spawn a minion from hand.');

const AIUseAbilityActionSchema = z.object({
  type: z.literal('useAbility'),
  minionId: z.string().describe('ID of the minion using the ability.'),
  abilityName: z.string().describe('Name of the ability to use (e.g., "Tongue Pull", "Teleport", "Detonate", "Mimic").'),
  targetPosition: z.object({ x: z.number().int(), y: z.number().int() }).optional().describe('Optional target position for the ability (e.g., for Tongue Pull, Teleport).'),
  targetMinionId: z.string().optional().describe('Optional ID of the target minion for the ability (e.g., for Teleport, Mimic).'),
}).describe('An action to use a minion\'s special ability.');

const AIEndTurnActionSchema = z.object({
  type: z.literal('endTurn'),
}).describe('An action to end the AI\'s turn.');

const AIActionSchema = z.discriminatedUnion('type', [
  AIAttackActionSchema,
  AIMoveActionSchema,
  AIDashActionSchema,
  AISpawnActionSchema,
  AIUseAbilityActionSchema,
  AIEndTurnActionSchema,
]).describe('A single action the AI opponent can take.');

const AIActionsSchema = z.object({
  actions: z.array(AIActionSchema).describe('A sequence of valid and strategic actions the AI opponent will take this turn.'),
  reasoning: z.string().describe('The AI\'s strategic reasoning for its chosen sequence of actions.'),
}).describe('The complete set of actions and reasoning for the AI opponent\'s turn.');

export type AIActions = z.infer<typeof AIActionsSchema>;

// --- Genkit Prompt Definition ---
const aiOpponentPrompt = ai.definePrompt({
  name: 'cheggOpponentStrategy',
  input: { schema: GameStateSchema },
  output: { schema: AIActionsSchema },
  prompt: `You are an expert player of CHEGG: The Complete Master Rulebook, a strategic board game. Your goal is to defeat your opponent by eliminating their Villager (King) while protecting your own. You must strictly adhere to all game rules and mana costs.

--- GAME RULES ---

I. Game Setup & Core Mechanics
 * The Board: A 10x8 checkerboard. The two rows at each end are Spawn Zones.
   * Red player's spawn zone: Rows 0 and 1.
   * Blue player's spawn zone: Rows 8 and 9.
 * The Goal: Eliminate the opponent's Villager to win the game.
 * Deck Building: Each player creates a deck of exactly 15 minions (handled by game engine, not AI).
 * Initial Setup: Players place their Villager anywhere within their own Spawn Zone for free. They shuffle their decks and draw 3 minions to form their starting hand.
 * Turn Flow:
   * Draw 1 minion at the start of every turn (handled by game engine, not AI).
   * Mana pool refreshes to its current maximum.
 * Spawn Sickness: Minions cannot move, attack, dash, or use abilities on the turn they are spawned.
 * Friendly Fire: Area-of-effect (AoE) and splash attacks damage all units in range, including your own.

II. Mana & Action Costs
 * Mana Progression: Players start with 1 Mana on Turn 1. The maximum capacity increases by +1 each turn until it caps at 6 Mana. Unspent mana is discarded at the end of the turn.
 * Spawning: Costs the specific mana value assigned to that minion.
 * Attacking: Costs 1 Mana (Except the Wither, which costs 2 Mana). Each minion can only attack once per turn.
 * Movement: Every minion on the board receives 1 free movement per turn.
   * Exception: The Villager is "heavy" and its first move always costs 1 Mana.
 * Dashing: A "Dash" is a second move performed by a minion in a single turn. It costs 1 Mana.
   * Exception: A Villager dash costs 2 Mana.
 * The Combo Rule: A single minion cannot Dash and Attack in the same turn. Furthermore, a minion cannot move (even a dash) after it has performed an attack.

III. Minion Master List (JSON format):
\`\`\`json
${MINION_MASTER_LIST_JSON}
\`\`\`

--- CURRENT GAME STATE ---
Your player is: {{{currentPlayer}}}
Opponent player is: {{{opponentPlayer}}}
Current Mana: {{{currentMana}}}
Max Mana Capacity: {{{maxManaCapacity}}}
Minions in your hand: {{{playerHand}}}

Game Board (board[row][col]):
\`\`\`json
{{{json board}}}
\`\`\`

--- TASK ---
Analyze the provided 'Current Game State' and the 'Minion Master List'. Formulate a sequence of strategic actions to be taken by the AI opponent during its turn.

Your strategy should prioritize:
1. Eliminating the opponent's Villager.
2. Protecting your own Villager.
3. Controlling key board positions.
4. Maximizing mana efficiency.
5. Making optimal trades with opponent minions.

You MUST ensure all actions are valid according to the game rules, mana costs, movement patterns, attack patterns, special abilities, spawn sickness, and the combo rule.

Output your actions as a JSON array adhering to the 'AIActionsSchema' provided. Include a 'reasoning' field explaining your strategic decisions.

Begin!
`,
});

// --- Genkit Flow Definition ---
const aiOpponentGameplayFlow = ai.defineFlow(
  {
    name: 'aiOpponentGameplayFlow',
    inputSchema: GameStateSchema,
    outputSchema: AIActionsSchema,
  },
  async (input) => {
    const { output } = await aiOpponentPrompt(input);
    return output!;
  }
);

// --- Exported Wrapper Function ---
export async function aiOpponentGameplay(input: GameState): Promise<AIActions> {
  return aiOpponentGameplayFlow(input);
}
