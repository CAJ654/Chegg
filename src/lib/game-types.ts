import { PlayerColor } from "./game-constants";

/**
 * Represents a single minion unit active on the game board.
 */
export interface MinionInstance {
  id: string; // Unique GUID/Timestamp for tracking
  type: string; // Minion category (Villager, Zombie, etc.)
  owner: PlayerColor; // Team affinity
  isVillager: boolean; // Flag for game-ending King units
  currentHealth: number; // For multi-HP units like Wither
  hasSpawnSickness: boolean; // Cannot act on the turn they are summoned
  hasAttackedThisTurn: boolean; // Tracking for single-action limit
  hasMovedThisTurn: boolean; // Tracking for Dash ability
  hasDashedThisTurn: boolean; // Tracking for movement limits
}

/**
 * A single coordinate on the 10x8 game board grid.
 */
export interface BoardCell {
  x: number; // Horizontal coordinate (0-7)
  y: number; // Vertical coordinate (0-9)
  minion: MinionInstance | null; // Occupancy state
  isDarkTile: boolean; // Used for Phantom movement restrictions
}

/**
 * The full representation of a match's state at any given point in time.
 */
export interface GameState {
  currentPlayer: PlayerColor;
  opponentPlayer: PlayerColor;
  redHand: string[]; // Cards currently available for spawning
  blueHand: string[];
  redDeck: string[]; // Remaining cards to be drawn
  blueDeck: string[];
  board: BoardCell[][]; // The 2D grid structure
  turnNumber: number; // Incremented every turn
  winner: PlayerColor | null; // Set when a King is eliminated
  logs: string[]; // Descriptive text for the UI sidebar
}

/**
 * Enumeration of all possible player interactions with the board.
 */
export type ActionType = 'spawn' | 'move' | 'dash' | 'attack' | 'useAbility';
