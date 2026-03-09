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
  const bluePool = playerDeck.filter(m => m !== 'Villager');
  const redPool = opponentDeck.filter(m => m !== 'Villager');

  // Draw initial hands
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
  
  // Phantom can only move if it is currently on a dark tile
  if (minion.type === "Phantom" && !gameState.board[startY][startX].isDarkTile) return [];

  const moves: { x: number, y: number }[] = [];
  const data = getMinionData(minion.type);
  
  // Rule: Villager first move costs 1 Mana
  if (!minion.hasMovedThisTurn && minion.isVillager && currentMana < 1) {
    return [];
  }

  // Rule: Dash restriction
  if (minion.hasMovedThisTurn && !minion.hasDashedThisTurn) {
    const dashCost = minion.isVillager ? 2 : 1;
    if (currentMana < dashCost) return [];
  } else if (minion.hasMovedThisTurn && minion.hasDashedThisTurn) {
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
      // Distance 1
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });

      // Slime Elastic Jump (Distance 2)
      if (minion.type === "Slime") {
        const nx2 = startX + d.dx * 2;
        const ny2 = startY + d.dy * 2;
        if (checkTile(nx2, ny2)) moves.push({ x: nx2, y: ny2 });
      }
    });
  } else if (data.movementPattern === "2 lateral, 1 diagonal") {
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      const isDiagonal = d.dx !== 0 && d.dy !== 0;
      
      // Distance 1
      const n1x = startX + d.dx;
      const n1y = startY + d.dy;
      if (checkTile(n1x, n1y)) moves.push({ x: n1x, y: n1y });

      // Distance 2 (ONLY if lateral for Frog)
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

export function getValidAbilities(gameState: GameState, minion: MinionInstance, startX: number, startY: number, currentMana: number): { x: number, y: number }[] {
  if (minion.hasSpawnSickness || minion.hasAttackedThisTurn || minion.hasDashedThisTurn || currentMana < 1) return [];

  const targets: { x: number, y: number }[] = [];

  if (minion.type === 'Frog' || minion.type === 'Enderman') {
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      let nx = startX + d.dx;
      let ny = startY + d.dy;
      while (nx >= 0 && nx < BOARD_COLS && ny >= 0 && ny < BOARD_ROWS) {
        const targetMinion = gameState.board[ny][nx].minion;
        if (targetMinion) {
          // Rule: Enderman cannot swap with Villagers
          if (minion.type === 'Enderman' && targetMinion.isVillager) break;
          
          targets.push({ x: nx, y: ny });
          break; // Line of sight stops at first unit
        }
        nx += d.dx;
        ny += d.dy;
      }
    });
  }

  return targets;
}

export function getValidAttacks(gameState: GameState, minion: MinionInstance, startX: number, startY: number, currentMana: number): { x: number, y: number }[] {
  if (minion.isVillager || minion.hasSpawnSickness || minion.hasAttackedThisTurn || minion.hasDashedThisTurn) return [];
  
  // Phantom can only attack if it is currently on a dark tile
  if (minion.type === "Phantom" && !gameState.board[startY][startX].isDarkTile) return [];

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
  } else if (data.attackPattern === "Move-to-attack") {
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      // Distance 1
      if (checkEnemy(startX + d.dx, startY + d.dy)) targets.push({ x: startX + d.dx, y: startY + d.dy });

      // Slime Elastic Move-to-attack (Distance 2)
      if (minion.type === "Slime") {
        if (checkEnemy(startX + d.dx * 2, startY + d.dy * 2)) {
          targets.push({ x: startX + d.dx * 2, y: startY + d.dy * 2 });
        }
      }
    });
  }

  return targets;
}
