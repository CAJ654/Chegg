import { PlayerColor } from "./game-constants";

export interface MinionInstance {
  id: string;
  type: string;
  owner: PlayerColor;
  isVillager: boolean;
  currentHealth: number;
  hasSpawnSickness: boolean;
  hasAttackedThisTurn: boolean;
  hasMovedThisTurn: boolean;
  hasDashedThisTurn: boolean;
}

export interface BoardCell {
  x: number; // column
  y: number; // row
  minion: MinionInstance | null;
  isDarkTile: boolean;
}

export interface GameState {
  currentPlayer: PlayerColor;
  opponentPlayer: PlayerColor;
  redHand: string[];
  blueHand: string[];
  redDeck: string[];
  blueDeck: string[];
  board: BoardCell[][];
  turnNumber: number;
  winner: PlayerColor | null;
  logs: string[];
}

export type ActionType = 'spawn' | 'move' | 'dash' | 'attack' | 'useAbility';
