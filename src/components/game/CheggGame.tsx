"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState, BoardCell, MinionInstance, ActionType } from "@/lib/game-types";
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
  playerDeck: string[];
}

export function CheggGame({ playerDeck }: CheggGameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number, y: number } | null>(null);
  const [validActions, setValidActions] = useState<{ x: number, y: number, type: ActionType }[]>([]);
  const [placementPhase, setPlacementPhase] = useState<'blue' | 'red' | 'done'>('blue');
  const [currentMana, setCurrentMana] = useState(1);
  const [maxManaCapacity, setMaxManaCapacity] = useState(1);
  const [spawningMinion, setSpawningMinion] = useState<string | null>(null);

  useEffect(() => {
    // For 2-player local, we'll give both players the same deck build or randomized copies
    const deck2 = [...playerDeck].sort(() => Math.random() - 0.5);
    setGameState(createInitialState(playerDeck, deck2));
  }, [playerDeck]);

  const log = useCallback((message: string) => {
    setGameState(prev => prev ? {
      ...prev,
      logs: [message, ...prev.logs.slice(0, 49)]
    } : null);
  }, []);

  const endTurn = useCallback(() => {
    if (!gameState) return;
    
    const nextPlayer = gameState.currentPlayer === 'Blue' ? 'Red' : 'Blue';
    const nextMaxMana = Math.min(6, Math.floor((gameState.turnNumber + 1) / 2) + 1);
    
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

      // Draw card logic
      let newBlueHand = [...prev.blueHand];
      let newBlueDeck = [...prev.blueDeck];
      let newRedHand = [...prev.redHand];
      let newRedDeck = [...prev.redDeck];

      if (nextPlayer === 'Blue' && newBlueDeck.length > 0) {
        newBlueHand.push(newBlueDeck.shift()!);
      } else if (nextPlayer === 'Red' && newRedDeck.length > 0) {
        newRedHand.push(newRedDeck.shift()!);
      }

      setMaxManaCapacity(nextMaxMana);
      setCurrentMana(nextMaxMana);

      return {
        ...prev,
        currentPlayer: nextPlayer,
        opponentPlayer: prev.currentPlayer,
        turnNumber: prev.turnNumber + 1,
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
    log(`Turn ended. It is now ${nextPlayer}'s turn.`);
  }, [gameState, log]);

  const handleTileClick = (x: number, y: number) => {
    if (!gameState || gameState.winner) return;

    // --- Placement Phase Logic ---
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
            return { ...prev, board: newBoard };
          });
          setPlacementPhase('red');
          log("Blue Villager placed. Red, place your Villager.");
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
            return { ...prev, board: newBoard };
          });
          setPlacementPhase('done');
          log("Villagers placed. Combat begins. Blue starts.");
        }
      }
      return;
    }

    // --- Combat / Action Logic ---
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
    setGameState(prev => {
      if (!prev) return null;
      const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
      let manaSpent = 0;
      const minion = { ...newBoard[fromY][fromX].minion! };

      if (type === 'move' || type === 'dash') {
        const isDash = minion.hasMovedThisTurn;
        manaSpent = isDash ? (minion.isVillager ? 2 : 1) : (minion.isVillager ? 1 : 0);
        
        minion.hasMovedThisTurn = true;
        if (isDash) minion.hasDashedThisTurn = true;

        newBoard[fromY][fromX].minion = null;
        newBoard[toY][toX].minion = minion;
        log(`${prev.currentPlayer} ${minion.type} moved to (${toX}, ${toY}).`);
      } else if (type === 'attack') {
        manaSpent = minion.type === "Wither" ? 2 : 1;
        minion.hasAttackedThisTurn = true;

        const target = newBoard[toY][toX].minion;
        if (target) {
          log(`${prev.currentPlayer} ${minion.type} attacked ${target.owner} ${target.type}.`);
          if (target.isVillager) {
            return { ...prev, winner: prev.currentPlayer, board: newBoard };
          }
          newBoard[toY][toX].minion = null;
        }
      }

      setCurrentMana(prevMana => prevMana - manaSpent);
      return { ...prev, board: newBoard };
    });
    setSelectedTile(null);
    setValidActions([]);
  };

  const startSpawn = (type: string) => {
    if (!gameState) return;
    const data = getMinionData(type);
    if (currentMana < data.cost) {
      toast({ title: "Insufficient Mana", description: `You need ${data.cost} mana to spawn this minion.`, variant: "destructive" });
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
      toast({ title: "Spawn Zone Full", description: "Clear your spawn zone to bring in new units.", variant: "destructive" });
      return;
    }

    setSpawningMinion(type);
    setValidActions(spawns);
    setSelectedTile(null);
  };

  const executeSpawn = (x: number, y: number, type: string) => {
    const data = getMinionData(type);
    setGameState(prev => {
      if (!prev) return null;
      const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
      
      const newHand = prev.currentPlayer === 'Blue' 
        ? prev.blueHand.filter((_, i) => i !== prev.blueHand.indexOf(type))
        : prev.redHand.filter((_, i) => i !== prev.redHand.indexOf(type));

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

      setCurrentMana(m => m - data.cost);
      log(`${prev.currentPlayer} spawned ${type} at (${x}, ${y}).`);

      return {
        ...prev,
        board: newBoard,
        blueHand: prev.currentPlayer === 'Blue' ? newHand : prev.blueHand,
        redHand: prev.currentPlayer === 'Red' ? newHand : prev.redHand,
      };
    });
    setSpawningMinion(null);
    setValidActions([]);
  };

  if (!gameState) return <div className="p-20 text-center">Preparing the Arena...</div>;

  const currentHand = gameState.currentPlayer === 'Blue' ? gameState.blueHand : gameState.redHand;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 relative min-h-0">
        <div className="absolute top-4 left-4 lg:top-8 lg:left-8 flex items-center gap-2 z-10">
          <Badge variant="outline" className={cn(
            "px-2 py-1 lg:px-4 lg:py-2 text-sm lg:text-lg transition-colors",
            gameState.currentPlayer === 'Blue' ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-red-500 bg-red-500/10 text-red-400"
          )}>
            Turn {gameState.turnNumber} • {gameState.currentPlayer}'s Turn
          </Badge>
          {placementPhase !== 'done' && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
              Placement: {placementPhase.toUpperCase()}
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

        <div className="relative bg-zinc-900/50 p-1 md:p-2 rounded-xl border border-white/10 shadow-2xl max-w-full">
          <div className="game-board w-[min(90vw,65vh)] h-[min(112.5vw,81.25vh)] shadow-2xl">
            {gameState.board.map((row, y) => 
              row.map((cell, x) => (
                <BoardTile 
                  key={`${x}-${y}`} 
                  cell={cell} 
                  isSelected={selectedTile?.x === x && selectedTile?.y === y}
                  isValidMove={validActions.some(a => a.x === x && a.y === y && a.type === 'move')}
                  isValidAttack={validActions.some(a => a.x === x && a.y === y && a.type === 'attack')}
                  isValidSpawn={validActions.some(a => a.x === x && a.y === y && a.type === 'spawn')}
                  onClick={() => handleTileClick(x, y)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/5 bg-zinc-950/50 backdrop-blur-xl flex flex-col overflow-hidden h-[35vh] lg:h-screen">
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
                    ? (i < currentMana ? "bg-primary shadow-[0_0_8px_rgba(117,31,189,0.5)]" : "bg-primary/20") 
                    : "bg-white/5"
                )} 
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-4 lg:p-6">
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2 lg:mb-3">
                  {gameState.currentPlayer} Hand
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
                  {currentHand.map((type, i) => (
                    <Card 
                      key={`${type}-${i}`} 
                      className={cn(
                        "cursor-pointer hover:border-primary/50 transition-all bg-zinc-900/50 border-white/5",
                        getMinionData(type).cost > currentMana && "opacity-40 grayscale",
                        spawningMinion === type && "ring-2 ring-primary bg-primary/10"
                      )}
                      onClick={() => startSpawn(type)}
                    >
                      <CardContent className="p-2 lg:p-3">
                        <div className="flex items-center gap-2">
                          <MinionIcon type={type} className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
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
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2 lg:mb-3">Battle Logs</h3>
                <div className="space-y-1.5 lg:space-y-2">
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
          <div className="grid grid-cols-1 gap-3">
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
    </div>
  );
}
