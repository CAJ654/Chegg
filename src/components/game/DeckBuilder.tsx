import { useState } from "react";
import { MINION_MASTER_LIST, DECK_SIZE, PlayerColor } from "@/lib/game-constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MinionIcon } from "./MinionIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface DeckBuilderProps {
  playerColor: PlayerColor;
  onComplete: (deck: string[]) => void;
  onBack: () => void;
  initialDeck?: string[];
}

export function DeckBuilder({ playerColor, onComplete, onBack, initialDeck }: DeckBuilderProps) {
  const [deck, setDeck] = useState<string[]>(initialDeck && initialDeck.length > 0 ? initialDeck : ["Villager"]);

  const addToDeck = (type: string) => {
    if (type === "Villager" && deck.includes("Villager")) return;
    
    if (deck.length < DECK_SIZE) {
      setDeck([...deck, type]);
    }
  };

  const removeFromDeck = (index: number) => {
    if (deck[index] === "Villager") return;
    const newDeck = [...deck];
    newDeck.splice(index, 1);
    setDeck(newDeck);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      <header className="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className={cn(
              "text-3xl md:text-4xl font-headline",
              playerColor === 'Blue' ? "text-blue-500" : "text-red-500"
            )}>
              {playerColor} Army Assembly
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Select 15 minions for your tactical squad. Your King is ready.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            variant="outline"
            onClick={() => setDeck(["Villager"])}
            className="w-full sm:w-auto"
          >
            Clear Deck
          </Button>
          <Button 
            disabled={deck.length !== DECK_SIZE} 
            onClick={() => onComplete(deck)}
            size="lg"
            className={cn(
              "text-white w-full sm:w-auto",
              playerColor === 'Blue' ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500"
            )}
          >
            Next ({deck.length}/{DECK_SIZE})
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1 min-h-0 overflow-y-auto mb-4">
        {/* Minion Catalog */}
        <div className="lg:col-span-2 flex flex-col h-full order-2 lg:order-1 min-h-[400px] resize-y overflow-hidden border border-white/10 rounded-lg">
          <Card className="flex flex-col h-full border-none bg-card/50 backdrop-blur-sm rounded-none">
            <CardHeader className="py-4 shrink-0">
              <CardTitle className="text-xl">Available Units</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <ScrollArea className="h-full px-4 md:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
                  {MINION_MASTER_LIST.filter(m => m.type !== "Villager").map(minion => (
                    <div 
                      key={minion.type}
                      className="p-3 md:p-4 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors group relative cursor-pointer"
                      onClick={() => addToDeck(minion.type)}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          playerColor === 'Blue' ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                        )}>
                          <MinionIcon type={minion.type} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center gap-2">
                            <h3 className="font-semibold truncate text-sm md:text-base">{minion.type}</h3>
                            <span className="text-yellow-500 text-xs md:text-sm font-bold whitespace-nowrap">{minion.cost} Mana</span>
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground leading-tight mt-1 line-clamp-2">{minion.specialAbilities}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-[9px] md:text-[10px] uppercase tracking-wider text-white/40">
                        <div>
                          <span className="block font-bold text-white/60 mb-1">Move</span>
                          {minion.movementPattern}
                        </div>
                        <div>
                          <span className="block font-bold text-white/60 mb-1">Attack</span>
                          {minion.attackPattern}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Current Deck */}
        <div className={cn(
          "flex flex-col h-full order-1 lg:order-2 min-h-[400px] resize-y overflow-hidden border rounded-lg",
          playerColor === 'Blue' ? "border-blue-500/20" : "border-red-500/20"
        )}>
          <Card className="flex flex-col h-full border-none bg-card/50 backdrop-blur-sm rounded-none">
            <CardHeader className="py-4 shrink-0">
              <CardTitle className="flex justify-between items-center text-xl">
                Army List
                <span className={cn(
                  "text-sm px-2 py-0.5 rounded-full",
                  deck.length === DECK_SIZE ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"
                )}>
                  {deck.length}/{DECK_SIZE}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <ScrollArea className="h-full px-4 md:px-6">
                <div className="space-y-2 pb-6">
                  {deck.map((type, i) => (
                    <div key={`${type}-${i}`} className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-zinc-900/40 border border-white/5 group hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <MinionIcon type={type} className={cn(
                          "w-4 h-4",
                          playerColor === 'Blue' ? "text-blue-400" : "text-red-400"
                        )} />
                        <span className="text-xs md:text-sm font-medium">{type}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 lg:opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromDeck(i)}
                        disabled={type === "Villager"}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
