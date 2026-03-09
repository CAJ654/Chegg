import { MinionData, MINION_MASTER_LIST, BOARD_ROWS, BOARD_COLS } from "./game-constants";
import { GameState, MinionInstance, BoardCell } from "./game-types";

/**
 * Retrieves the static data for a specific minion type from the master list.
 * @param type The string identifier of the minion (e.g., "Zombie").
 */
export function getMinionData(type: string): MinionData {
  return MINION_MASTER_LIST.find(m => m.type === type)!;
}

/**
 * Initializes a new game state with empty board and shuffled/dealt decks.
 * @param playerDeck The list of minion types selected by the Blue player.
 * @param opponentDeck The list of minion types selected by the Red player.
 */
export function createInitialState(playerDeck: string[], opponentDeck: string[]): GameState {
  // Build the 10x8 grid with coordinate-based light/dark tile patterns
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

  // Filter out the Villager (King) as it's placed during deployment, not drawn
  const bluePool = playerDeck.filter(m => m !== 'Villager');
  const redPool = opponentDeck.filter(m => m !== 'Villager');

  // Initial hand size is 3
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

/**
 * Calculates all valid movement destination for a specific minion.
 * Logic accounts for unit types, mana costs (for Villager moves), and special conditions like Phantom's Ethereal trait.
 */
export function getValidMoves(gameState: GameState, minion: MinionInstance, startX: number, startY: number, currentMana: number): { x: number, y: number }[] {
  // Units cannot move if they have spawn sickness or have already attacked this turn
  if (minion.hasSpawnSickness || minion.hasAttackedThisTurn) return [];
  // Phantoms must be on a dark tile to initiate any action
  if (minion.type === "Phantom" && !gameState.board[startY][startX].isDarkTile) return [];

  const moves: { x: number, y: number }[] = [];
  const data = getMinionData(minion.type);
  
  // Mana checks for the King (Villager)
  if (!minion.hasMovedThisTurn && minion.isVillager && currentMana < 1) {
    return [];
  }

  // Mana checks for Dash moves (second move in a turn)
  if (minion.hasMovedThisTurn && !minion.hasDashedThisTurn) {
    const dashCost = minion.isVillager ? 2 : 1;
    if (currentMana < dashCost) return [];
  } else if (minion.hasMovedThisTurn && minion.hasDashedThisTurn) {
    // Already moved twice
    return [];
  }

  /**
   * Helper to validate a specific coordinate for a standard move.
   */
  const checkTile = (tx: number, ty: number) => {
    if (tx < 0 || tx >= BOARD_COLS || ty < 0 || ty >= BOARD_ROWS) return false;
    if (gameState.board[ty][tx].minion) return false; // Tiles must be empty
    if (minion.type === "Phantom" && !gameState.board[ty][tx].isDarkTile) return false; // Phantom movement restriction
    return true;
  };

  // Switch logic based on movement patterns defined in game-constants
  if (data.movementPattern === "8 surrounding squares" || data.movementPattern === "8 surrounding squares (Range 2)" || data.movementPattern === "2 lateral / 2 diagonal") {
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      // Check adjacent square
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (checkTile(nx, ny)) moves.push({ x: nx, y: ny });

      // Range 2 units can jump or slide further
      if (minion.type === "Slime" || minion.type === "Phantom" || minion.type === "Parrot") {
        const nx2 = startX + d.dx * 2;
        const ny2 = startY + d.dy * 2;
        if (checkTile(nx2, ny2)) moves.push({ x: nx2, y: ny2 });
      }
    });
  } else if (data.movementPattern === "Lateral: 2, Diagonal: 1") {
    // Specific pattern for Frog: further reach laterally than diagonally
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      const isDiagonal = d.dx !== 0 && d.dy !== 0;
      const n1x = startX + d.dx;
      const n1y = startY + d.dy;
      if (checkTile(n1x, n1y)) moves.push({ x: n1x, y: n1y });

      if (!isDiagonal) {
        const n2x = startX + (d.dx * 2);
        const n2y = startY + (d.dy * 2);
        if (checkTile(n2x, n2y)) moves.push({ x: n2x, y: n2y });
      }
    });
  } else if (data.movementPattern === "3 squares forward only") {
    // Standard Zombie movement
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

/**
 * Calculates valid targets for special abilities (Frog pull, Enderman swap).
 */
export function getValidAbilities(gameState: GameState, minion: MinionInstance, startX: number, startY: number, currentMana: number): { x: number, y: number }[] {
  // Ability usage costs 1 mana and ends the unit's turn
  if (minion.hasSpawnSickness || minion.hasAttackedThisTurn || minion.hasDashedThisTurn || currentMana < 1) return [];

  const targets: { x: number, y: number }[] = [];

  if (minion.type === 'Frog' || minion.type === 'Enderman') {
    // Both pull and swap function along lateral lines
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      let nx = startX + d.dx;
      let ny = startY + d.dy;
      while (nx >= 0 && nx < BOARD_COLS && ny >= 0 && ny < BOARD_ROWS) {
        const targetMinion = gameState.board[ny][nx].minion;
        if (targetMinion) {
          // Endermen cannot swap with Villagers (Kings)
          if (minion.type === 'Enderman' && targetMinion.isVillager) break;
          targets.push({ x: nx, y: ny });
          break; // Stop at the first minion found
        }
        nx += d.dx;
        ny += d.dy;
      }
    });
  }

  return targets;
}

/**
 * Calculates all valid attack targets for a specific minion based on its pattern.
 */
export function getValidAttacks(gameState: GameState, minion: MinionInstance, startX: number, startY: number, currentMana: number): { x: number, y: number }[] {
  // Villagers cannot attack. Units with sickness or those that have already acted cannot attack.
  if (minion.isVillager || minion.hasSpawnSickness || minion.hasAttackedThisTurn || minion.hasDashedThisTurn) return [];
  if (minion.type === "Phantom" && !gameState.board[startY][startX].isDarkTile) return [];

  // Mana check for standard vs expensive attacks
  const attackCost = minion.type === "Wither" ? 2 : 1;
  if (currentMana < attackCost) return [];

  const targets: { x: number, y: number }[] = [];
  const data = getMinionData(minion.type);

  /**
   * Helper to check if a tile contains an enemy unit.
   */
  const checkEnemy = (tx: number, ty: number) => {
    if (tx < 0 || tx >= BOARD_COLS || ty < 0 || ty >= BOARD_ROWS) return false;
    const targetMinion = gameState.board[ty][tx].minion;
    if (targetMinion && targetMinion.owner !== minion.owner) return true;
    return false;
  };

  // Parrot Mimicry: Dynamically combines attack patterns of laterally adjacent neighbors
  if (minion.type === "Parrot") {
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    const neighborTypes = new Set<string>();
    
    lats.forEach(d => {
      const nx = startX + d.dx;
      const ny = startY + d.dy;
      if (nx >= 0 && nx < BOARD_COLS && ny >= 0 && ny < BOARD_ROWS) {
        const neighbor = gameState.board[ny][nx].minion;
        if (neighbor && neighbor.type !== "Parrot" && neighbor.type !== "Villager") {
          neighborTypes.add(neighbor.type);
        }
      }
    });

    neighborTypes.forEach(type => {
      const mockMinion: MinionInstance = { ...minion, type };
      const mimickedTargets = getValidAttacks(gameState, mockMinion, startX, startY, currentMana);
      mimickedTargets.forEach(t => {
        if (!targets.some(existing => existing.x === t.x && existing.y === t.y)) {
          targets.push(t);
        }
      });
    });
    
    if (neighborTypes.size > 0) return targets;
  }

  // Attack Pattern Dispatcher
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
    // Iron Golem Sweep: Targets a line perpendicular to the direction of attack
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
    // Ranged (Skeleton): Line of sight check
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
        if (gameState.board[ny][nx].minion) break; // Projectile blocked by first unit
      }
    });
  } else if (data.attackPattern === "2-tile lateral range") {
    // Ranged (Blaze)
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
    // Wither Storm Projectile: Hits a T-shape at the end of a line
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
  } else if (data.attackPattern === "T-Shape Kinetic") {
    // Shulker Box Pattern: Branched line of sight
    const lats = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    lats.forEach(d => {
      const midX = startX + d.dx;
      const midY = startY + d.dy;
      
      if (midX < 0 || midX >= BOARD_COLS || midY < 0 || midY >= BOARD_ROWS) return;

      const midCell = gameState.board[midY][midX];
      if (midCell.minion) {
        if (midCell.minion.owner !== minion.owner) {
          targets.push({ x: midX, y: midY });
        }
        return; // Path blocked at dist 1
      }

      const tip = { x: startX + d.dx * 2, y: startY + d.dy * 2 };
      const arm1 = { x: startX + d.dx * 2 + d.dy, y: startY + d.dy * 2 + d.dx };
      const arm2 = { x: startX + d.dx * 2 - d.dy, y: startY + d.dy * 2 - d.dx };

      [tip, arm1, arm2].forEach(t => {
        if (checkEnemy(t.x, t.y)) {
          if (!targets.some(existing => existing.x === t.x && existing.y === t.y)) {
            targets.push(t);
          }
        }
      });
    });
  } else if (data.attackPattern === "Move-to-attack" || data.attackPattern === "Move-to-attack (Range 2)") {
    // Slime and Phantom: Attacks the tile they land on
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];
    directions.forEach(d => {
      const nx1 = startX + d.dx;
      const ny1 = startY + d.dy;
      if (checkEnemy(nx1, ny1)) {
          if (minion.type !== "Phantom" || gameState.board[ny1][nx1].isDarkTile) {
            targets.push({ x: nx1, y: ny1 });
          }
      }

      if (minion.type === "Slime" || minion.type === "Phantom") {
        const nx2 = startX + d.dx * 2;
        const ny2 = startY + d.dy * 2;
        if (checkEnemy(nx2, ny2)) {
          if (minion.type !== "Phantom" || gameState.board[ny2][nx2].isDarkTile) {
            targets.push({ x: nx2, y: ny2 });
          }
        }
      }
    });
  }

  return targets;
}
