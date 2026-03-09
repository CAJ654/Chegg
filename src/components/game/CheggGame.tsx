"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState, MinionInstance, ActionType } from "@/lib/game-types";
import { createInitialState, getValidMoves, getValidAttacks, getMinionData } from "@/lib/game-logic";
import { BoardTile } from "./BoardTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MinionIcon } from "./MinionIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CheggGameProps {
  blueDeck: string[];
  redDeck: string[];
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROW_LABELS = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];

export function CheggGame({ blueDeck, redDeck }: CheggGameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number, y: number } | null>(null);
  const [validActions, setValidActions] = useState<{ x: number, y: number, type: ActionType }[]>([]);
  const [placementPhase, setPlacementPhase] = useState<'blue' | 'red' | 'done'>('blue');
  const [currentMana, setCurrentMana] = useState(1);
  const [maxManaCapacity, setMaxManaCapacity] = useState(1);
  const [spawningMinion, setSpawningMinion] = useState<string | null>(null);

  useEffect(() => {
    setGameState(createInitialState(blueDeck, redDeck));
  }, [blueDeck, redDeck]);

  useEffect(() => {
    if (placementPhase === 'done' || !gameState) return;

    const spawns: { x: number, y: number, type: ActionType }[] = [];
    const minRow = placementPhase === 'blue' ? 8 : 0;
    const maxRow = placementPhase === 'blue' ? 10 : 2;

    for (let y = minRow; y < maxRow; y++) {
      for (let x = 0; x < 8; x++) {
        if (!gameState.board[y][x].minion) spawns.push({ x, y, type: 'spawn' });
      }
    }
    setValidActions(spawns);
  }, [placementPhase, gameState?.board]);

  const log = useCallback((message: string) => {
    setGameState(prev => prev ? {
      ...prev,
      logs: [message, ...prev.logs.slice(0, 49)]
    } : null);
  }, []);

  const endTurn = useCallback(() => {
    if (!gameState) return;
    
    const isEndingRedTurn = gameState.currentPlayer === 'Red';
    const nextPlayer = isEndingRedTurn ? 'Blue' : 'Red';
    
    const nextTurnNumber = isEndingRedTurn ? gameState.turnNumber + 1 : gameState.turnNumber;
    const nextMaxMana = Math.min(6, nextTurnNumber);
    
    // Count cats for mana bonus
    let catBonus = 0;
    gameState.board.forEach(row => row.forEach(cell => {
      if (cell.minion && cell.minion.type === 'Cat' && cell.minion.owner === nextPlayer) {
        catBonus++;
      }
    }));

    if (isEndingRedTurn) {
        setMaxManaCapacity(nextMaxMana);
    }
    
    setCurrentMana(nextMaxMana + catBonus);

    setGameState(prev => {
      if (!prev) return null;
      
      const newBoard = prev.board.map(row => row.map(cell => {
        if (cell.minion && cell.minion.owner === nextPlayer) {
          return {
            ...cell,
            minion: {
              ...cell.minion,
              hasSpawnSickness: false,
              hasMovedThisTurn: false,
              hasAttackedThisTurn: false,
              hasDashedThisTurn: false
            }
          };
        }
        return cell;
      }));

      let newBlueHand = [...prev.blueHand];
      let newBlueDeck = [...prev.blueDeck];
      let newRedHand = [...prev.redHand];
      let newRedDeck = [...prev.redDeck];

      if (nextPlayer === 'Blue' && newBlueDeck.length > 0) {
        newBlueHand.push(newBlueDeck.shift()!);
      } else if (nextPlayer === 'Red' && newRedDeck.length > 0) {
        newRedHand.push(newRedDeck.shift()!);
      }

      return {
        ...prev,
        currentPlayer: nextPlayer,
        opponentPlayer: prev.currentPlayer,
        turnNumber: nextTurnNumber,
        board: newBoard,
        blueHand: newBlueHand,
        blueDeck: newBlueDeck,
        redHand: newRedHand,
        redDeck: newRedDeck,
      };
    });

    setSelectedTile(null);
    setValidActions([]);
    setSpawningMinion(null);
    log(`Turn ended. It is now ${nextPlayer}'s turn.${catBonus > 0 ? ` (+${catBonus} Cat Mana!)` : ''}`);
  }, [gameState, log]);

  const handleTileClick = (x: number, y: number) => {
    if (!gameState || gameState.winner) return;

    if (placementPhase !== 'done') {
      if (placementPhase === 'blue') {
        if (y > 7 && !gameState.board[y][x].minion) {
          setGameState(prev => {
            if (!prev) return null;
            const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
            newBoard[y][x].minion = {
              id: 'villager-blue',
              type: 'Villager',
              owner: 'Blue',
              isVillager: true,
              currentHealth: 1,
              hasSpawnSickness: false,
              hasAttackedThisTurn: false,
              hasMovedThisTurn: false,
              hasDashedThisTurn: false
            };
            return { ...prev, board: newBoard, currentPlayer: 'Red' };
          });
          setPlacementPhase('red');
          log("Blue King placed. Red, position your King.");
        }
      } else if (placementPhase === 'red') {
        if (y < 2 && !gameState.board[y][x].minion) {
          setGameState(prev => {
            if (!prev) return null;
            const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
            newBoard[y][x].minion = {
              id: 'villager-red',
              type: 'Villager',
              owner: 'Red',
              isVillager: true,
              currentHealth: 1,
              hasSpawnSickness: false,
              hasAttackedThisTurn: false,
              hasMovedThisTurn: false,
              hasDashedThisTurn: false
            };
            return { ...prev, board: newBoard, currentPlayer: 'Blue' };
          });
          setPlacementPhase('done');
          setCurrentMana(1); 
          setMaxManaCapacity(1);
          log("Deployment complete. Combat begins. Blue starts.");
        }
      }
      return;
    }

    const action = validActions.find(a => a.x === x && a.y === y);
    if (action) {
      if (action.type === 'spawn' && spawningMinion) {
        executeSpawn(x, y, spawningMinion);
      } else if (selectedTile) {
        executeAction(selectedTile.x, selectedTile.y, x, y, action.type);
      }
      return;
    }

    const cell = gameState.board[y][x];
    if (cell.minion && cell.minion.owner === gameState.currentPlayer) {
      setSelectedTile({ x, y });
      setSpawningMinion(null);
      const moves = getValidMoves(gameState, cell.minion, x, y, currentMana).map(m => ({ ...m, type: 'move' as ActionType }));
      const attacks = getValidAttacks(gameState, cell.minion, x, y, currentMana).map(a => ({ ...a, type: 'attack' as ActionType }));
      setValidActions([...moves, ...attacks]);
    } else {
      setSelectedTile(null);
      setValidActions([]);
      setSpawningMinion(null);
    }
  };

  const executeAction = (fromX: number, fromY: number, toX: number, toY: number, type: ActionType) => {
    let manaRequired = 0;
    const attacker = { ...gameState!.board[fromY][fromX].minion! };

    if (type === 'move' || type === 'dash') {
      const isDash = attacker.hasMovedThisTurn;
      manaRequired = isDash ? (attacker.isVillager ? 2 : 1) : (attacker.isVillager ? 1 : 0);
    } else if (type === 'attack') {
      manaRequired = attacker.type === "Wither" ? 2 : 1;
    }

    if (currentMana < manaRequired) {
      toast({ title: "Insufficient Mana", description: "You cannot afford this action.", variant: "destructive" });
      return;
    }

    setCurrentMana(prev => prev - manaRequired);

    setGameState(prev => {
      if (!prev) return null;
      const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
      
      let newBlueHand = [...prev.blueHand];
      let newBlueDeck = [...prev.blueDeck];
      let newRedHand = [...prev.redHand];
      let newRedDeck = [...prev.redDeck];

      const updatedMinion = { ...newBoard[fromY][fromX].minion! };

      if (type === 'move' || type === 'dash') {
        const isDash = updatedMinion.hasMovedThisTurn;
        updatedMinion.hasMovedThisTurn = true;
        if (isDash) updatedMinion.hasDashedThisTurn = true;

        // Rabbit Lucky Foot: Draw 1 minion if it jumps over any unit during its move.
        if (updatedMinion.type === 'Rabbit') {
          const dx = Math.abs(toX - fromX);
          const dy = Math.abs(toY - fromY);
          if (dx === 2 || dy === 2) {
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            if (newBoard[midY] && newBoard[midY][midX] && newBoard[midY][midX].minion) {
              if (updatedMinion.owner === 'Blue' && newBlueDeck.length > 0) {
                newBlueHand.push(newBlueDeck.shift()!);
                log("Rabbit Lucky Foot: Blue draws a card!");
              } else if (updatedMinion.owner === 'Red' && newRedDeck.length > 0) {
                newRedHand.push(newRedDeck.shift()!);
                log("Rabbit Lucky Foot: Red draws a card!");
              }
            }
          }
        }

        newBoard[fromY][fromX].minion = null;
        newBoard[toY][toX].minion = updatedMinion;
        log(`${prev.currentPlayer} ${updatedMinion.type} moved to ${COL_LABELS[toX]}${ROW_LABELS[toY]}.`);
      } else if (type === 'attack') {
        updatedMinion.hasAttackedThisTurn = true;
        
        // Multi-hit/AoE logic
        let victims: { x: number, y: number }[] = [{ x: toX, y: toY }];

        if (updatedMinion.type === 'Creeper') {
          log(`${prev.currentPlayer} Creeper DETONATED!`);
          victims = [];
          const directions = [
            { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
            { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
          ];
          directions.forEach(d => victims.push({ x: fromX + d.dx, y: fromY + d.dy }));
          newBoard[fromY][fromX].minion = null;
        } else if (updatedMinion.type === 'Puffer-Fish') {
            log(`${prev.currentPlayer} Puffer-Fish SPIKES!`);
            victims = [
                { x: fromX - 1, y: fromY - 1 }, { x: fromX + 1, y: fromY - 1 },
                { x: fromX - 1, y: fromY + 1 }, { x: fromX + 1, y: fromY + 1 }
            ];
        } else if (updatedMinion.type === 'Iron Golem') {
            log(`${prev.currentPlayer} Iron Golem SWEEP!`);
            const dx = toX - fromX;
            const dy = toY - fromY;
            if (dx === 0) { // Vertical attack
                victims = [{ x: fromX - 1, y: toY }, { x: fromX, y: toY }, { x: fromX + 1, y: toY }];
            } else { // Horizontal attack
                victims = [{ x: toX, y: fromY - 1 }, { x: toX, y: fromY }, { x: toX, y: fromY + 1 }];
            }
        } else if (updatedMinion.type === 'Wither') {
            log(`${prev.currentPlayer} Wither STORM PROJECTILE!`);
            const dx = toX - fromX;
            const dy = toY - fromY;
            if (dx === 0) {
                victims = [{ x: toX - 1, y: toY }, { x: toX, y: toY }, { x: toX + 1, y: toY }];
            } else {
                victims = [{ x: toX, y: toY - 1 }, { x: toX, y: toY }, { x: toX, y: toY + 1 }];
            }
        }

        let blueVillagerDead = false;
        let redVillagerDead = false;

        victims.forEach(v => {
          if (v.x < 0 || v.x >= 8 || v.y < 0 || v.y >= 10) return;
          const target = newBoard[v.y][v.x].minion;
          if (target) {
            if (target.type === 'Wither') {
              const currentHP = target.currentHealth ?? 3;
              if (currentHP > 1) {
                newBoard[v.y][v.x].minion = { ...target, currentHealth: currentHP - 1 };
                log(`Wither takes damage! ${currentHP - 1} HP remaining.`);
                return;
              }
            }

            // Pig Death Ability: Hoarder
            if (target.type === 'Pig') {
              if (target.owner === 'Blue' && newBlueDeck.length > 0) {
                newBlueHand.push(newBlueDeck.shift()!);
                log("Pig Death Hoarder: Blue draws a card!");
              } else if (target.owner === 'Red' && newRedDeck.length > 0) {
                newRedHand.push(newRedDeck.shift()!);
                log("Pig Death Hoarder: Red draws a card!");
              }
            }

            if (target.isVillager) {
              if (target.owner === 'Blue') blueVillagerDead = true;
              else redVillagerDead = true;
            }
            newBoard[v.y][v.x].minion = null;
          }
        });

        let winner = prev.winner;
        if (redVillagerDead && !blueVillagerDead) winner = 'Blue';
        else if (blueVillagerDead && !redVillagerDead) winner = 'Red';
        else if (blueVillagerDead && redVillagerDead) winner = prev.currentPlayer === 'Blue' ? 'Blue' : 'Red';

        return { ...prev, board: newBoard, winner, blueHand: newBlueHand, blueDeck: newBlueDeck, redHand: newRedHand, redDeck: newRedDeck };
      }

      return { 
        ...prev, 
        board: newBoard,
        blueHand: newBlueHand,
        blueDeck: newBlueDeck,
        redHand: newRedHand,
        redDeck: newRedDeck
      };
    });
    setSelectedTile(null);
    setValidActions([]);
  };

  const startSpawn = (type: string) => {
    if (!gameState) return;
    const data = getMinionData(type);
    
    if (type === "Villager" && placementPhase === 'done') {
        toast({ title: "Invalid Action", description: "Your King is already on the battlefield.", variant: "destructive" });
        return;
    }

    if (currentMana < data.cost) {
      toast({ title: "Insufficient Mana", description: `You need ${data.cost} mana to spawn this unit.`, variant: "destructive" });
      return;
    }

    const spawns: { x: number, y: number, type: ActionType }[] = [];
    const minRow = gameState.currentPlayer === 'Blue' ? 8 : 0;
    const maxRow = gameState.currentPlayer === 'Blue' ? 10 : 2;

    for (let y = minRow; y < maxRow; y++) {
      for (let x = 0; x < 8; x++) {
        if (!gameState.board[y][x].minion) spawns.push({ x, y, type: 'spawn' });
      }
    }

    if (spawns.length === 0) {
      toast({ title: "Spawn Zone Full", description: "Clear your deployment zone to summon new units.", variant: "destructive" });
      return;
    }

    setSpawningMinion(type);
    setValidActions(spawns);
    setSelectedTile(null);
  };

  const executeSpawn = (x: number, y: number, type: string) => {
    const data = getMinionData(type);
    
    if (currentMana < data.cost) {
      toast({ title: "Insufficient Mana", description: "You can no longer afford this unit.", variant: "destructive" });
      setSpawningMinion(null);
      setValidActions([]);
      return;
    }

    setCurrentMana(prev => prev - data.cost);

    setGameState(prev => {
      if (!prev) return null;
      const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
      
      let newBlueHand = [...prev.blueHand];
      let newBlueDeck = [...prev.blueDeck];
      let newRedHand = [...prev.redHand];
      let newRedDeck = [...prev.redDeck];

      if (prev.currentPlayer === 'Blue') {
        const idx = newBlueHand.indexOf(type);
        if (idx !== -1) newBlueHand.splice(idx, 1);
      } else {
        const idx = newRedHand.indexOf(type);
        if (idx !== -1) newRedHand.splice(idx, 1);
      }

      newBoard[y][x].minion = {
        id: `${type}-${Date.now()}`,
        type: type,
        owner: prev.currentPlayer,
        isVillager: false,
        currentHealth: data.hp || 1,
        hasSpawnSickness: true,
        hasAttackedThisTurn: false,
        hasMovedThisTurn: false,
        hasDashedThisTurn: false
      };

      log(`${prev.currentPlayer} summoned ${type} at ${COL_LABELS[x]}${ROW_LABELS[y]}.`);

      // Pig Hoarder Spawn Ability: Draw 1 minion on spawn.
      if (type === 'Pig') {
        if (prev.currentPlayer === 'Blue' && newBlueDeck.length > 0) {
          newBlueHand.push(newBlueDeck.shift()!);
          log(`Pig Hoarder: Blue draws a card!`);
        } else if (prev.currentPlayer === 'Red' && newRedDeck.length > 0) {
          newRedHand.push(newRedDeck.shift()!);
          log(`Pig Hoarder: Red draws a card!`);
        }
      }

      let winner = prev.winner;

      if (type === 'Wither') {
        log(`WITHER SPAWN STORM ACTIVATED!`);
        const directions = [
          { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
          { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
          { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
        ];

        let blueVillagerDead = false;
        let redVillagerDead = false;

        directions.forEach(d => {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (nx >= 0 && nx < 8 && ny >= 0 && ny < 10) {
            const victim = newBoard[ny][nx].minion;
            if (victim) {
              log(`Storm destroyed ${victim.owner} ${victim.type}`);

              // Pig Death Ability: Hoarder
              if (victim.type === 'Pig') {
                if (victim.owner === 'Blue' && newBlueDeck.length > 0) {
                  newBlueHand.push(newBlueDeck.shift()!);
                  log("Pig Death Hoarder (Storm): Blue draws a card!");
                } else if (victim.owner === 'Red' && newRedDeck.length > 0) {
                  newRedHand.push(newRedDeck.shift()!);
                  log("Pig Death Hoarder (Storm): Red draws a card!");
                }
              }

              if (victim.isVillager) {
                if (victim.owner === 'Blue') blueVillagerDead = true;
                else redVillagerDead = true;
              }
              newBoard[ny][nx].minion = null;
            }
          }
        });

        if (redVillagerDead && !blueVillagerDead) winner = 'Blue';
        else if (blueVillagerDead && !redVillagerDead) winner = 'Red';
        else if (blueVillagerDead && redVillagerDead) winner = prev.currentPlayer === 'Blue' ? 'Blue' : 'Red';
      }

      return {
        ...prev,
        board: newBoard,
        winner,
        blueHand: newBlueHand,
        blueDeck: newBlueDeck,
        redHand: newRedHand,
        redDeck: newRedDeck,
      };
    });
    setSpawningMinion(null);
    setValidActions([]);
  };

  if (!gameState) return <div className="p-20 text-center text-white">Preparing the Arena...</div>;

  const currentHand = gameState.currentPlayer === 'Blue' ? gameState.blueHand : gameState.redHand;
  const isMyPlacementPhase = (placementPhase === 'blue' && gameState.currentPlayer === 'Blue') || 
                            (placementPhase === 'red' && gameState.currentPlayer === 'Red');
  const displayedHand = isMyPlacementPhase ? ["Villager", ...currentHand] : currentHand;

  const isRedTurn = gameState.currentPlayer === 'Red';
  const displayBoard = isRedTurn 
    ? [...gameState.board].reverse().map(row => [...row].reverse()) 
    : gameState.board;
  const displayRowLabels = isRedTurn ? [...ROW_LABELS].reverse() : ROW_LABELS;
  const displayColLabels = isRedTurn ? [...COL_LABELS].reverse() : COL_LABELS;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 relative min-h-0 bg-[#1a161e]">
        <div className="absolute top-4 left-4 lg:top-8 lg:left-8 flex items-center gap-2 z-10">
          <Badge variant="outline" className={cn(
            "px-2 py-1 lg:px-4 lg:py-2 text-sm lg:text-lg transition-colors",
            gameState.currentPlayer === 'Blue' ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-red-500 bg-red-500/10 text-red-400"
          )}>
            {placementPhase === 'done' ? `Turn ${gameState.turnNumber} • ${gameState.currentPlayer}'s Turn` : `Deployment • ${gameState.currentPlayer}'s Turn`}
          </Badge>
          {placementPhase !== 'done' && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
              Position your King
            </Badge>
          )}
        </div>

        {gameState.winner && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-center p-6 md:p-10 bg-zinc-900 border border-primary/50 rounded-2xl shadow-2xl animate-in zoom-in-95 mx-4">
              <h1 className={cn(
                "text-4xl md:text-6xl font-headline mb-4",
                gameState.winner === 'Blue' ? "text-blue-500" : "text-red-500"
              )}>{gameState.winner} Victory!</h1>
              <p className="text-base md:text-xl text-muted-foreground mb-8">The battlefield belongs to the {gameState.winner} master.</p>
              <Button size="lg" onClick={() => window.location.reload()}>New Game</Button>
            </div>
          </div>
        )}

        <div className="relative flex flex-col items-center">
            <div className="flex w-[min(90vw,65vh)] justify-around px-1 mb-1">
                {displayColLabels.map(l => <span key={l} className="text-[10px] md:text-xs font-headline text-white/30 uppercase tracking-tighter w-full text-center">{l}</span>)}
            </div>
            
            <div className="flex items-center">
                <div className="flex flex-col h-[min(112.5vw,81.25vh)] justify-around pr-1 md:pr-2">
                    {displayRowLabels.map((l, i) => <span key={`left-${i}`} className="text-[10px] md:text-xs font-headline text-white/30 w-4 text-right">{l}</span>)}
                </div>

                <div className="relative bg-zinc-900/50 p-1 md:p-2 rounded-xl border border-white/10 shadow-2xl max-w-full">
                    <div className="game-board w-[min(90vw,65vh)] h-[min(112.5vw,81.25vh)] shadow-2xl">
                        {displayBoard.map((row) => {
                          return row.map((cell) => (
                              <BoardTile 
                              key={`${cell.x}-${cell.y}`} 
                              cell={cell} 
                              isSelected={selectedTile?.x === cell.x && selectedTile?.y === cell.y}
                              isValidMove={validActions.some(a => a.x === cell.x && a.y === cell.y && a.type === 'move')}
                              isValidAttack={validActions.some(a => a.x === cell.x && a.y === cell.y && a.type === 'attack')}
                              isValidSpawn={validActions.some(a => a.x === cell.x && a.y === cell.y && a.type === 'spawn')}
                              onClick={() => handleTileClick(cell.x, cell.y)}
                              />
                          ))
                        })}
                    </div>
                </div>

                <div className="flex flex-col h-[min(112.5vw,81.25vh)] justify-around pl-1 md:pl-2">
                    {displayRowLabels.map((l, i) => <span key={`right-${i}`} className="text-[10px] md:text-xs font-headline text-white/30 w-4">{l}</span>)}
                </div>
            </div>

            <div className="flex w-[min(90vw,65vh)] justify-around px-1 mt-1">
                {displayColLabels.map(l => <span key={l} className="text-[10px] md:text-xs font-headline text-white/30 uppercase tracking-tighter w-full text-center">{l}</span>)}
            </div>
        </div>
      </div>

      <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/5 bg-zinc-950/50 backdrop-blur-xl flex flex-col overflow-hidden h-[45vh] lg:h-screen">
        <div className="p-4 lg:p-6 border-b border-white/5 bg-primary/5 shrink-0">
          <div className="flex justify-between items-end mb-2 lg:mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Mana Reserves</p>
              <h2 className="text-2xl lg:text-4xl font-headline text-primary">{currentMana} / {maxManaCapacity}</h2>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className={cn(
                "mb-1 text-[10px]",
                gameState.currentPlayer === 'Blue' ? "bg-blue-600" : "bg-red-600"
              )}>{gameState.currentPlayer} Control</Badge>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 lg:h-2 flex-1 rounded-full transition-all duration-300",
                  i < maxManaCapacity 
                    ? (i < (currentMana - (currentMana > maxManaCapacity ? (currentMana - maxManaCapacity) : 0)) ? "bg-primary shadow-[0_0_8px_rgba(117,31,189,0.5)]" : "bg-primary/20") 
                    : "bg-white/5"
                )} 
              />
            ))}
            {currentMana > maxManaCapacity && (
              <div className="absolute right-6 top-16 text-[10px] text-yellow-500 font-bold animate-pulse">
                +{currentMana - maxManaCapacity} CAT MANA
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0 resize-y">
          <ScrollArea className="flex-1">
            <div className="p-4 lg:p-6 space-y-6">
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-3">
                  {gameState.currentPlayer} Hand
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {displayedHand.map((type, i) => (
                    <Card 
                      key={`${type}-${i}`} 
                      className={cn(
                        "cursor-pointer hover:border-primary/50 transition-all bg-zinc-900/50 border-white/5",
                        getMinionData(type).cost > currentMana && placementPhase === 'done' && "opacity-40 grayscale",
                        spawningMinion === type && "ring-2 ring-primary bg-primary/10",
                        type === "Villager" && placementPhase !== 'done' && "border-yellow-500/50 bg-yellow-500/10"
                      )}
                      onClick={() => {
                        if (placementPhase !== 'done') {
                          if (type === "Villager") {
                            toast({ title: "Deployment", description: "Click a highlighted tile to place your King." });
                          }
                          return;
                        }
                        startSpawn(type);
                      }}
                    >
                      <CardContent className="p-2 lg:p-3">
                        <div className="flex items-center gap-2">
                          <MinionIcon type={type} className="w-4 h-4 text-primary" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] text-primary/80 font-bold">{getMinionData(type).cost} Mana</p>
                            <p className="text-[10px] lg:text-xs font-medium truncate">{type}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Battle Logs</h3>
                <div className="space-y-2">
                  {gameState.logs.map((msg, i) => (
                    <div key={i} className="text-[10px] lg:text-xs border-l-2 border-primary/20 pl-3 py-1 text-muted-foreground animate-in slide-in-from-left-2">
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 lg:p-6 border-t border-white/5 bg-zinc-950 shrink-0">
          <Button 
            className="w-full bg-primary hover:bg-primary/80 h-10 lg:h-12 text-sm lg:text-md font-headline"
            onClick={endTurn}
            disabled={placementPhase !== 'done'}
          >
            End Turn
          </Button>
        </div>
      </div>
    </div>
  );
}
