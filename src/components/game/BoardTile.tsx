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
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative w-full aspect-square border-[0.5px] border-white/5 flex items-center justify-center cursor-pointer transition-all duration-200",
        cell.isDarkTile ? "bg-[#1a161d]" : "bg-[#2d2531]",
        isSpawnZoneRed && "bg-red-500/5",
        isSpawnZoneBlue && "bg-blue-500/5",
        isSelected && "ring-2 ring-primary ring-inset z-10 bg-primary/20",
        isValidMove && "after:absolute after:w-3 after:h-3 after:bg-secondary/40 after:rounded-full hover:bg-secondary/20",
        isValidAttack && "ring-2 ring-destructive ring-inset z-10 bg-destructive/20 hover:bg-destructive/30",
        isValidSpawn && "ring-2 ring-green-500 ring-inset z-10 bg-green-500/20 hover:bg-green-500/30",
      )}
    >
      {cell.minion && (
        <div className={cn(
          "w-5/6 h-5/6 rounded-lg flex items-center justify-center transition-transform",
          cell.minion.owner === 'Red' ? "bg-red-900/40 border-2 border-red-500/50 text-red-200" : "bg-blue-900/40 border-2 border-blue-500/50 text-blue-200",
          cell.minion.hasSpawnSickness && "opacity-50 grayscale",
          isSelected && "scale-110",
        )}>
          <MinionIcon type={cell.minion.type} className="w-6 h-6" />
          {cell.minion.isVillager && <div className="absolute top-0 right-0 -mr-1 -mt-1 w-3 h-3 bg-yellow-400 rounded-full border border-black" />}
        </div>
      )}
    </div>
  );
}