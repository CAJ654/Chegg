export type PlayerColor = 'Red' | 'Blue';

export interface MinionData {
  type: string;
  cost: number;
  movementPattern: string;
  attackPattern: string;
  specialAbilities: string;
  icon?: string;
  hp?: number;
}

export const MINION_MASTER_LIST: MinionData[] = [
  { type: "Villager", cost: 0, movementPattern: "8 surrounding squares", attackPattern: "None", specialAbilities: "King: Losing this unit ends the game. Cannot attack. First move costs 1 Mana; Dash costs 2.", hp: 1 },
  { type: "Zombie", cost: 1, movementPattern: "3 squares forward", attackPattern: "4 lateral directions", specialAbilities: "Basic unit.", hp: 1 },
  { type: "Creeper", cost: 1, movementPattern: "8 surrounding squares", attackPattern: "8 surrounding squares", specialAbilities: "Detonate: Attack destroys everything in range and eliminates the Creeper.", hp: 1 },
  { type: "Pig", cost: 1, movementPattern: "8 surrounding squares", attackPattern: "None", specialAbilities: "Hoarder: Draw 1 minion on spawn and 1 on death.", hp: 1 },
  { type: "Rabbit", cost: 2, movementPattern: "2-tile lateral 'hop'", attackPattern: "None", specialAbilities: "Lucky Foot: Draw 1 minion if it jumps over any unit during its move.", hp: 1 },
  { type: "Puffer-Fish", cost: 2, movementPattern: "4 lateral directions", attackPattern: "4 diagonal squares", specialAbilities: "Spikes: Hits all 4 diagonal squares simultaneously.", hp: 1 },
  { type: "Iron Golem", cost: 2, movementPattern: "8 surrounding squares", attackPattern: "3 adjacent lateral tiles", specialAbilities: "Sweep: Hits all 3 targeted tiles at once in a lateral direction.", hp: 1 },
  { type: "Frog", cost: 2, movementPattern: "8 surrounding squares", attackPattern: "None", specialAbilities: "Tongue Pull (1 Mana): Pulls a unit in a lateral line 2 squares closer.", hp: 1 },
  { type: "Skeleton", cost: 3, movementPattern: "4 lateral directions", attackPattern: "3-tile diagonal range", specialAbilities: "Ranged: Hits targets up to 3 tiles away diagonally.", hp: 1 },
  { type: "Blaze", cost: 3, movementPattern: "4 diagonal directions", attackPattern: "2-tile lateral range", specialAbilities: "Ranged: Hits targets up to 2 tiles away laterally.", hp: 1 },
  { type: "Phantom", cost: 3, movementPattern: "8 surrounding squares", attackPattern: "8 surrounding squares", specialAbilities: "Ethereal: Can only spawn, move, or attack on dark tiles.", hp: 1 },
  { type: "Enderman", cost: 4, movementPattern: "Cannot move", attackPattern: "8 surrounding squares", specialAbilities: "Teleport (1 Mana): Swap places with any unit (except Villager) in a lateral line.", hp: 1 },
  { type: "Slime", cost: 4, movementPattern: "8 surrounding squares", attackPattern: "Move-to-attack", specialAbilities: "Elastic: Can jump over pieces. Attacks the tile it lands on (Cost: 1 Mana).", hp: 1 },
  { type: "Shulker-Box", cost: 4, movementPattern: "Attack-move only", attackPattern: "Ranged (Line of Sight)", specialAbilities: "Kinetic: Only moves by 'teleporting' to the tile of a unit it attacks.", hp: 1 },
  { type: "Parrot", cost: 5, movementPattern: "8 surrounding squares", attackPattern: "Variable", specialAbilities: "Mimic: Copies the attack pattern of any laterally adjacent minion.", hp: 1 },
  { type: "Cat", cost: 5, movementPattern: "Cannot move", attackPattern: "None", specialAbilities: "Feline Grace: Grants owner +1 Mana per turn (Stacks).", hp: 1 },
  { type: "Sniffer", cost: 5, movementPattern: "8 surrounding squares", attackPattern: "None", specialAbilities: "Scent: Spawn: Draw 2 from enemy deck; Death: Discard 2 from your hand.", hp: 1 },
  { type: "Wither", cost: 6, movementPattern: "8 surrounding squares", attackPattern: "3-tile lateral projectile", specialAbilities: "Storm: Spawn: Destroys surrounding 8 squares. Attack (2 Mana): Hits target + lateral splash.", hp: 3 },
];

export const BOARD_ROWS = 10;
export const BOARD_COLS = 8;
export const MAX_MANA = 6;
export const DECK_SIZE = 15;
