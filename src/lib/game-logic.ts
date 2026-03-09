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

  // Filter out the Villager from the pool of cards used for hand and deck
  // because the Villager is placed manually during the setup phase.
  const bluePool = playerDeck.filter(m => m !== 'Villager');
  const redPool = opponentDeck.filter(m => m !== 'Villager');

  // Draw initial hands from the remaining 14 cards
  const blueHand = bluePool.slice(0, 3);
  const blueDeck = bluePool.slice(3);
  
  const redHand = redPool.slice(0, 3);
  const redDeck = redPool.slice(3);

  return {
    currentPlayer: 'Blue',
    opponentPlayer: 'Red',
    blueHand,
    blueDeck,
    redHand,
    redDeck,
    board,
    turnNumber: 1,
    winner: null,
    logs: ["Game Started. Turn 1. Blue's Turn."],
  };
}

export function getMinionData(type: string): MinionData {
  return MINION_MASTER_LIST.find(m => m.type === type)!;
}

export function getValidMoves(gameState: GameState, minion: MinionInstance, startX: number, startY: number, currentMana: number): { x: number, y: number }[] {
  if (minion.hasSpawnSickness || minion.hasAttackedThisTurn) return [];
  
  const moves: { x: number, y: number }[] = [];
  const data = getMinionData(minion.type);
  
  // Rule: Villager first move costs 1 Mana
  if (!minion.hasMovedThisTurn && minion.isVillager && currentMana < 1) {
    return [];
  }

  // Rule: Dash restriction (second move costs 1, Villager costs 2)
  if (minion.hasMovedThisTurn && !minion.hasDashedThisTurn) {
    const dashCost = minion.isVillager ? 2 : 1;
    if (currentMana < dashCost) return [];
  } else if (minion.hasMovedThisTurn && minion.hasDashedThisTurn) {
    // Already moved and dashed
    return [];
  }

  const checkTile = (tx: number, ty: number) => {
    if (tx < 0 || tx >= BOARD_COLS || ty < 0 || ty >= BOARD_ROWS) return false;
    if (gameState.board[ty][tx].minion) return false;
    if (minion.type === "Phantom" && !gameState.board[ty][tx].isDarkTile) return false;
    return true;
  };

  if (data.movementPattern === "8 surrounding squares") {
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });
    });
  } else if (data.movementPattern === "2 lateral, 1 diagonal") {
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      const isDiagonal = d.dx !== 0 && d.dy !== 0;
      
      // Distance 1 (Allowed for both)
      const n1x = startX + d.dx;
      const n1y = startY + d.dy;
      if (checkTile(n1x, n1y)) moves.push({ x: n1x, y: n1y });

      // Distance 2 (ONLY if lateral)
      if (!isDiagonal) {
        const n2x = startX + (d.dx * 2);
        const n2y = startY + (d.dy * 2);
        if (checkTile(n2x, n2y)) moves.push({ x: n2x, y: n2y });
      }
    });
  } else if (data.movementPattern === "3 squares forward") {
    const dir = minion.owner === 'Blue' ? -1 : 1;
    const ny = startY + dir;
    [-1, 0, 1].forEach(dx => {
      const nx = startX + dx;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });
    });
  } else if (data.movementPattern === "4 lateral directions") {
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });
    });
  } else if (data.movementPattern === "4 diagonal directions") {
    const diags = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
    diags.forEach(d => {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });
    });
  } else if (data.movementPattern === "2-tile lateral 'hop'") {
    const hops = [{ dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 }];
    hops.forEach(d => {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });
    });
  }

  return moves;
}

export function getValidAttacks(gameState: GameState, minion: MinionInstance, startX: number, startY: number, currentMana: number): { x: number, y: number }[] {
  // Guard: Villagers cannot attack
  if (minion.isVillager || minion.hasSpawnSickness || minion.hasAttackedThisTurn || minion.hasDashedThisTurn) return [];
  
  const attackCost = minion.type === "Wither" ? 2 : 1;
  if (currentMana < attackCost) return [];

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
  } else if (data.attackPattern === "3 adjacent lateral tiles") {
    // Iron Golem sweep: hits a 3-tile arc. Clicking a lateral tile targets the sweep in that direction.
    // If ANY of the 3 tiles in the sweep contain an enemy, the lateral tile is a valid attack target.
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      const tx = startX + d.dx;
      const ty = startY + d.dy;
      if (tx < 0 || tx >= BOARD_COLS || ty < 0 || ty >= BOARD_ROWS) return;

      const sweep = d.dx === 0 
        ? [{ x: tx - 1, y: ty }, { x: tx, y: ty }, { x: tx + 1, y: ty }]
        : [{ x: tx, y: ty - 1 }, { x: tx, y: ty }, { x: tx, y: ty + 1 }];
      
      if (sweep.some(s => checkEnemy(s.x, s.y))) {
        targets.push({ x: tx, y: ty });
      }
    });
  } else if (data.attackPattern === "4 lateral directions") {
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      if (checkEnemy(startX + d.dx, startY + d.dy)) targets.push({ x: startX + d.dx, y: startY + d.dy });
    });
  } else if (data.attackPattern === "4 diagonal squares") {
    const diags = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
    diags.forEach(d => {
      if (checkEnemy(startX + d.dx, startY + d.dy)) targets.push({ x: startX + d.dx, y: startY + d.dy });
    });
  } else if (data.attackPattern === "3-tile diagonal range") {
    const diags = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
    diags.forEach(d => {
      for (let i = 1; i <= 3; i++) {
        const nx = startX + (d.dx * i);
        const ny = startY + (d.dy * i);
        if (nx < 0 || nx >= BOARD_COLS || ny < 0 || ny >= BOARD_ROWS) break;
        if (checkEnemy(nx, ny)) {
            targets.push({ x: nx, y: ny });
            break; 
        }
        if (gameState.board[ny][nx].minion) break; 
      }
    });
  } else if (data.attackPattern === "2-tile lateral range") {
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      for (let i = 1; i <= 2; i++) {
        const nx = startX + (d.dx * i);
        const ny = startY + (d.dy * i);
        if (nx < 0 || nx >= BOARD_COLS || ny < 0 || ny >= BOARD_ROWS) break;
        if (checkEnemy(nx, ny)) {
            targets.push({ x: nx, y: ny });
            break;
        }
        if (gameState.board[ny][nx].minion) break;
      }
    });
  } else if (data.attackPattern === "3-tile lateral projectile") {
    // Wither logic: target + lateral splash. If any tile in the impact zone hits an enemy, highlight the target tile.
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      for (let i = 1; i <= 3; i++) {
        const nx = startX + (d.dx * i);
        const ny = startY + (d.dy * i);
        if (nx < 0 || nx >= BOARD_COLS || ny < 0 || ny >= BOARD_ROWS) break;
        
        const sweep = d.dx === 0
            ? [{ x: nx - 1, y: ny }, { x: nx, y: ny }, { x: nx + 1, y: ny }]
            : [{ x: nx, y: ny - 1 }, { x: nx, y: ny }, { x: nx, y: ny + 1 }];
        
        if (sweep.some(s => checkEnemy(s.x, s.y))) {
            targets.push({ x: nx, y: ny });
        }
        
        if (gameState.board[ny][nx].minion) break; 
      }
    });
  } else if (data.attackPattern === "Ranged (Line of Sight)") {
    const dirs = [
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];
    dirs.forEach(d => {
        let nx = startX + d.dx;
        let ny = startY + d.dy;
        while (nx >= 0 && nx < BOARD_COLS && ny >= 0 && ny < BOARD_ROWS) {
            if (checkEnemy(nx, ny)) {
                targets.push({ x: nx, y: ny });
                break;
            }
            if (gameState.board[ny][nx].minion) break;
            nx += d.dx;
            ny += d.dy;
        }
    });
  }

  return targets;
}
