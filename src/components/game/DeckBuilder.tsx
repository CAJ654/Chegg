import { useState } from "react";
import { MINION_MASTER_LIST, DECK_SIZE } from "@/lib/game-constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MinionIcon } from "./MinionIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DeckBuilderProps {
  onComplete: (deck: string[]) => void;
}

export function DeckBuilder({ onComplete }: DeckBuilderProps) {
  const [deck, setDeck] = useState<string[]>(["Villager"]);

  const addToDeck = (type: string) => {
    if (deck.length < DECK_SIZE) {
      setDeck([...deck, type]);
    }
  };

  const removeFromDeck = (index: number) => {
    if (deck[index] === "Villager") return; // Cannot remove king
    const newDeck = [...deck];
    newDeck.splice(index, 1);
    setDeck(newDeck);
  };

  const counts = deck.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 flex flex-col h-screen max-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline text-primary">Assemble Your Army</h1>
          <p className="text-muted-foreground">Select 15 minions. Your Villager is already in place.</p>
        </div>
        <Button 
          disabled={deck.length !== DECK_SIZE} 
          onClick={() => onComplete(deck)}
          size="lg"
          className="bg-primary hover:bg-primary/80"
        >
          Begin Conquest ({deck.length}/{DECK_SIZE})
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="md:col-span-2 flex flex-col min-h-0 border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Minion Catalog</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MINION_MASTER_LIST.filter(m => m.type !== "Villager").map(minion => (
                  <div 
                    key={minion.type}
                    className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors group relative cursor-pointer"
                    onClick={() => addToDeck(minion.type)}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <MinionIcon type={minion.type} className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{minion.type}</h3>
                          <span className="text-secondary text-sm font-bold">{minion.cost} Mana</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-tight mt-1">{minion.specialAbilities}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] uppercase tracking-wider text-white/40">
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

        <Card className="flex flex-col min-h-0 border-secondary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Current Deck
              <span className={cn(
                "text-sm px-2 py-0.5 rounded-full",
                deck.length === DECK_SIZE ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
              )}>
                {deck.length}/{DECK_SIZE}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-2">
                {deck.map((type, i) => (
                  <div key={`${type}-${i}`} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-white/5 group hover:border-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <MinionIcon type={type} className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
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
  );
}