import { BoardCell } from "@/lib/game-types";
import { cn } from "@/lib/utils";
import { MinionIcon } from "./MinionIcon";

interface BoardTileProps {
  cell: BoardCell;
  isSelected: boolean;
  isValidMove: boolean;
  isValidAttack: boolean;
  isValidSpawn: boolean;
  onClick: () => void;
}

export function BoardTile({ 
  cell, 
  isSelected, 
  isValidMove, 
  isValidAttack, 
  isValidSpawn, 
  onClick 
}: BoardTileProps) {
  const isSpawnZoneRed = cell.y < 2;
  const isSpawnZoneBlue = cell.y > 7;
  
  // A minion is considered "done" for the turn if it has spawn sickness, 
  // has already attacked, or has already used its dash move.
  const isMinionDone = cell.minion && (
    cell.minion.hasSpawnSickness || 
    cell.minion.hasAttackedThisTurn || 
    cell.minion.hasDashedThisTurn
  );
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative w-full aspect-square border-[0.5px] border-zinc-500/10 flex items-center justify-center cursor-pointer transition-all duration-200",
        cell.isDarkTile ? "tile-dark" : "tile-light",
        isSpawnZoneRed && "spawn-zone-red",
        isSpawnZoneBlue && "spawn-zone-blue",
        isSelected && "ring-4 ring-primary ring-inset z-10 bg-primary/20",
        isValidMove && "after:absolute after:w-4 after:h-4 after:bg-secondary/60 after:rounded-full after:shadow-sm hover:bg-secondary/20",
        isValidAttack && "ring-4 ring-destructive ring-inset z-10 bg-destructive/30 hover:bg-destructive/40",
        isValidSpawn && "ring-4 ring-green-500 ring-inset z-10 bg-green-500/30 hover:bg-green-500/40",
      )}
    >
      {cell.minion && (
        <div className={cn(
          "w-5/6 h-5/6 rounded-lg flex items-center justify-center transition-transform shadow-xl",
          cell.minion.owner === 'Red' 
            ? "bg-red-700 border-2 border-red-400 text-white" 
            : "bg-blue-700 border-2 border-blue-400 text-white",
          isMinionDone && "opacity-60 grayscale",
          isSelected && "scale-110 rotate-3",
        )}>
          <MinionIcon type={cell.minion.type} className="w-6 h-6 drop-shadow-md" />
          {cell.minion.isVillager && (
            <div className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-zinc-950 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
