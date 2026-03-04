import { MinionData, MINION_MASTER_LIST, BOARD_ROWS, BOARD_COLS } from "./game-constants";
import { GameState, MinionInstance, BoardCell } from "./game-types";

export function createInitialState(playerDeck: string[], opponentDeck: string[]): GameState {
  const board: BoardCell[][] = [];
  for (let y = 0; y < BOARD_ROWS; y++) {
    const row: BoardCell[] = [];
    for (let x = 0; x < BOARD_COLS; x++) {
      row.push({
        x,
        y,
        minion: null,
        isDarkTile: (x + y) % 2 === 1
      });
    }
    board.push(row);
  }

  // Draw initial hands
  const initialHand = playerDeck.slice(0, 3);
  const remainingDeck = playerDeck.slice(3);

  return {
    currentPlayer: 'Blue', // Blue is typically human player
    opponentPlayer: 'Red',
    currentMana: 1,
    maxManaCapacity: 1,
    playerHand: initialHand,
    opponentHandSize: 3,
    playerDeck: remainingDeck,
    opponentDeckSize: 12,
    board,
    turnNumber: 1,
    winner: null,
    logs: ["Game Started. Turn 1."],
    isAITurn: false
  };
}

export function getMinionData(type: string): MinionData {
  return MINION_MASTER_LIST.find(m => m.type === type)!;
}

export function getValidMoves(gameState: GameState, minion: MinionInstance, startX: number, startY: number): { x: number, y: number }[] {
  if (minion.hasSpawnSickness || minion.hasAttackedThisTurn) return [];
  
  const moves: { x: number, y: number }[] = [];
  const data = getMinionData(minion.type);
  
  // Dash restriction: Cannot move (even dash) after attack
  if (minion.hasMovedThisTurn && !minion.hasDashedThisTurn) {
    // Check if player has mana for dash
    const dashCost = minion.isVillager ? 2 : 1;
    if (gameState.currentMana < dashCost) return [];
  } else if (minion.hasMovedThisTurn && minion.hasDashedThisTurn) {
    return [];
  }

  // Basic 8-surrounding move logic used by many
  const directions = [
    { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
    { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
  ];

  const checkTile = (tx: number, ty: number) => {
    if (tx < 0 || tx >= BOARD_COLS || ty < 0 || ty >= BOARD_ROWS) return false;
    if (gameState.board[ty][tx].minion) return false;
    
    // Phantom logic: Ethereal
    if (minion.type === "Phantom" && !gameState.board[ty][tx].isDarkTile) return false;
    
    return true;
  };

  if (data.movementPattern === "8 surrounding squares") {
    directions.forEach(d => {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });
    });
  } else if (data.movementPattern === "3 squares forward only") {
    const dir = minion.owner === 'Blue' ? -1 : 1;
    for (let i = 1; i <= 3; i++) {
      const ny = startY + (dir * i);
      if (checkTile(startX, ny)) moves.push({ x: startX, y: ny });
      else break; // blocked
    }
  } else if (data.movementPattern === "4 lateral directions") {
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      // Logic for Shulker Box etc might vary but standard 1 tile for simple movement
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });
    });
  }

  return moves;
}

export function getValidAttacks(gameState: GameState, minion: MinionInstance, startX: number, startY: number): { x: number, y: number }[] {
  if (minion.hasSpawnSickness || minion.hasAttackedThisTurn || minion.hasDashedThisTurn) return [];
  
  // Wither attack costs 2 mana, others 1
  const attackCost = minion.type === "Wither" ? 2 : 1;
  if (gameState.currentMana < attackCost) return [];

  const targets: { x: number, y: number }[] = [];
  const data = getMinionData(minion.type);

  const checkEnemy = (tx: number, ty: number) => {
    if (tx < 0 || tx >= BOARD_COLS || ty < 0 || ty >= BOARD_ROWS) return false;
    const targetMinion = gameState.board[ty][tx].minion;
    if (targetMinion && targetMinion.owner !== minion.owner) return true;
    return false;
  };

  if (data.attackPattern === "8 surrounding squares") {
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      if (checkEnemy(startX + d.dx, startY + d.dy)) targets.push({ x: startX + d.dx, y: startY + d.dy });
    });
  } else if (data.attackPattern === "4 lateral directions") {
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      if (checkEnemy(startX + d.dx, startY + d.dy)) targets.push({ x: startX + d.dx, y: startY + d.dy });
    });
  } else if (data.attackPattern === "3-tile diagonal range") {
    const diags = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
    diags.forEach(d => {
      for (let i = 1; i <= 3; i++) {
        const nx = startX + (d.dx * i);
        const ny = startY + (d.dy * i);
        if (checkEnemy(nx, ny)) targets.push({ x: nx, y: ny });
      }
    });
  }

  return targets;
}
