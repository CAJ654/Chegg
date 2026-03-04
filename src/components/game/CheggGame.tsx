
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [isPlacingVillager, setIsPlacingVillager] = useState(true);
  const aiThinkingRef = useRef(false);

  useEffect(() => {
    const aiDeck = [...playerDeck].sort(() => Math.random() - 0.5);
    setGameState(createInitialState(playerDeck, aiDeck));
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
    const nextMaxMana = Math.min(6, gameState.turnNumber + 1);
    
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

      return {
        ...prev,
        currentPlayer: nextPlayer,
        opponentPlayer: prev.currentPlayer,
        turnNumber: prev.turnNumber + 1,
        maxManaCapacity: nextMaxMana,
        currentMana: nextMaxMana,
        board: newBoard,
        isAITurn: nextPlayer === 'Red',
      };
    });

    log(`Turn ended. It is now ${nextPlayer}'s turn.`);
  }, [gameState, log]);

  // Basic Scripted AI: Just ends turn after a delay
  useEffect(() => {
    if (gameState?.isAITurn && !gameState.winner && !aiThinkingRef.current) {
      aiThinkingRef.current = true;
      const timer = setTimeout(() => {
        endTurn();
        aiThinkingRef.current = false;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.isAITurn, gameState?.winner, endTurn]);

  const handleTileClick = (x: number, y: number) => {
    if (!gameState || gameState.winner || gameState.isAITurn) return;

    if (isPlacingVillager) {
      if (y > 7 && !gameState.board[y][x].minion) {
        setGameState(prev => {
          if (!prev) return null;
          const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
          newBoard[y][x] = {
            ...newBoard[y][x],
            minion: {
              id: 'villager-blue',
              type: 'Villager',
              owner: 'Blue',
              isVillager: true,
              currentHealth: 1,
              hasSpawnSickness: false,
              hasAttackedThisTurn: false,
              hasMovedThisTurn: false,
              hasDashedThisTurn: false
            }
          };
          const aiX = Math.floor(Math.random() * 8);
          const aiY = Math.floor(Math.random() * 2);
          newBoard[aiY][aiX] = {
            ...newBoard[aiY][aiX],
            minion: {
              id: 'villager-red',
              type: 'Villager',
              owner: 'Red',
              isVillager: true,
              currentHealth: 1,
              hasSpawnSickness: false,
              hasAttackedThisTurn: false,
              hasMovedThisTurn: false,
              hasDashedThisTurn: false
            }
          };
          return { ...prev, board: newBoard };
        });
        setIsPlacingVillager(false);
        log("Villagers placed. Combat begins.");
      }
      return;
    }

    const action = validActions.find(a => a.x === x && a.y === y);
    if (action && selectedTile) {
      executeAction(selectedTile.x, selectedTile.y, x, y, action.type);
      return;
    }

    const cell = gameState.board[y][x];
    if (cell.minion && cell.minion.owner === gameState.currentPlayer) {
      setSelectedTile({ x, y });
      const moves = getValidMoves(gameState, cell.minion, x, y).map(m => ({ ...m, type: 'move' as ActionType }));
      const attacks = getValidAttacks(gameState, cell.minion, x, y).map(a => ({ ...a, type: 'attack' as ActionType }));
      setValidActions([...moves, ...attacks]);
    } else {
      setSelectedTile(null);
      setValidActions([]);
    }
  };

  const executeAction = (fromX: number, fromY: number, toX: number, toY: number, type: ActionType) => {
    setGameState(prev => {
      if (!prev) return null;
      const newBoard = prev.board.map(row => row.map(cell => ({ ...cell })));
      let newMana = prev.currentMana;
      const minion = { ...newBoard[fromY][fromX].minion! };

      if (type === 'move' || type === 'dash') {
        const isDash = minion.hasMovedThisTurn;
        const moveCost = isDash ? (minion.isVillager ? 2 : 1) : (minion.isVillager ? 1 : 0);
        
        newMana -= moveCost;
        minion.hasMovedThisTurn = true;
        if (isDash) minion.hasDashedThisTurn = true;

        newBoard[fromY][fromX].minion = null;
        newBoard[toY][toX].minion = minion;
      } else if (type === 'attack') {
        const attackCost = minion.type === "Wither" ? 2 : 1;
        newMana -= attackCost;
        minion.hasAttackedThisTurn = true;

        const target = newBoard[toY][toX].minion;
        if (target) {
          if (target.isVillager) {
            return { ...prev, winner: prev.currentPlayer, board: newBoard };
          }
          newBoard[toY][toX].minion = null;
        }
      }

      return {
        ...prev,
        board: newBoard,
        currentMana: newMana
      };
    });
    setSelectedTile(null);
    setValidActions([]);
  };

  const spawnMinion = (type: string) => {
    if (!gameState || gameState.isAITurn) return;
    const data = getMinionData(type);
    if (gameState.currentMana < data.cost) return;

    const spawns: { x: number, y: number, type: ActionType }[] = [];
    for (let y = 8; y < 10; y++) {
      for (let x = 0; x < 8; x++) {
        if (!gameState.board[y][x].minion) spawns.push({ x, y, type: 'spawn' });
      }
    }
    setValidActions(spawns);
    setSelectedTile(null);
  };

  if (!gameState) return <div className="p-20 text-center">Loading battlefield...</div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-8 left-8 flex items-center gap-4">
          <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary-foreground px-4 py-2 text-lg">
            Turn {gameState.turnNumber} • {gameState.currentPlayer} Player
          </Badge>
        </div>

        {gameState.winner && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-center p-10 bg-zinc-900 border border-primary/50 rounded-2xl shadow-2xl animate-in zoom-in-95">
              <h1 className="text-6xl font-headline mb-4 text-primary">{gameState.winner} Wins!</h1>
              <p className="text-xl text-muted-foreground mb-8">The kingdom has fallen. A new master rises.</p>
              <Button size="lg" onClick={() => window.location.reload()}>Play Again</Button>
            </div>
          </div>
        )}

        <div className="relative bg-zinc-900/50 p-2 rounded-xl border border-white/10 shadow-2xl">
          <div className="game-board w-[min(80vh,80vw)] h-[min(100vh,100vw)] max-w-[600px] max-h-[750px] shadow-2xl">
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

      <div className="w-[380px] border-l border-white/5 bg-zinc-950/50 backdrop-blur-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-primary/5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Arcane Resources</p>
              <h2 className="text-4xl font-headline text-primary">{gameState.currentMana} / {gameState.maxManaCapacity} Mana</h2>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-1">{gameState.currentPlayer}</Badge>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-300",
                  i < gameState.maxManaCapacity 
                    ? (i < gameState.currentMana ? "bg-primary shadow-[0_0_8px_rgba(117,31,189,0.5)]" : "bg-primary/20") 
                    : "bg-white/5"
                )} 
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Minions in Hand</h3>
                <div className="grid grid-cols-2 gap-2">
                  {gameState.playerHand.map((type, i) => (
                    <Card 
                      key={`${type}-${i}`} 
                      className={cn(
                        "cursor-pointer hover:border-primary/50 transition-all bg-zinc-900/50 border-white/5",
                        getMinionData(type).cost > gameState.currentMana && "opacity-40 grayscale"
                      )}
                      onClick={() => spawnMinion(type)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <MinionIcon type={type} className="w-4 h-4 text-primary" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] text-primary/80 font-bold">{getMinionData(type).cost} Mana</p>
                            <p className="text-xs font-medium truncate">{type}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Battle Records</h3>
                <div className="space-y-2">
                  {gameState.logs.map((log, i) => (
                    <div key={i} className="text-xs border-l-2 border-primary/20 pl-3 py-1 text-muted-foreground animate-in slide-in-from-left-2">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="p-6 border-t border-white/5 bg-zinc-950">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/80 h-12 text-md font-headline"
              onClick={endTurn}
              disabled={gameState.isAITurn}
            >
              End Turn
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 font-headline"
              onClick={() => {
                const instructions = "Objective: Capture the Blue Villager. Use mana efficiently. Red minions are yours.";
                toast({ title: "Rules Reminder", description: instructions });
              }}
            >
              Rules
            </Button>
          </div>
          {gameState.isAITurn && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-primary animate-pulse">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Opponent is thinking...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
