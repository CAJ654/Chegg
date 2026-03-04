"use client";

import { useState } from "react";
import { DeckBuilder } from "@/components/game/DeckBuilder";
import { CheggGame } from "@/components/game/CheggGame";
import { RulesDialog } from "@/components/game/RulesDialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sword, Zap } from "lucide-react";

export default function Home() {
  const [phase, setPhase] = useState<'landing' | 'deck' | 'game'>('landing');
  const [playerDeck, setPlayerDeck] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);

  const startDeckBuilding = () => setPhase('deck');
  
  const startGame = (deck: string[]) => {
    setPlayerDeck(deck);
    setPhase('game');
  };

  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#18141a]">
        {/* Background glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-secondary/10 blur-[120px]" />

        <main className="z-10 text-center px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <Zap className="w-4 h-4 fill-primary" />
            The Arcane Warfare Simulator
          </div>
          
          <h1 className="text-7xl md:text-9xl font-headline text-white mb-6 tracking-tighter leading-none animate-in fade-in duration-1000">
            CHEGG <span className="text-primary">TACTICS</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            A strategic chess-inspired battleground where mana flow and minion positioning decide the fate of kingdoms.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <Button size="lg" className="h-16 px-12 text-xl font-headline rounded-2xl" onClick={startDeckBuilding}>
              <Sword className="mr-3 w-6 h-6" /> Enter Arena
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 px-12 text-xl font-headline rounded-2xl"
              onClick={() => setShowRules(true)}
            >
              <ShieldCheck className="mr-3 w-6 h-6" /> How to Play
            </Button>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <h3 className="text-primary font-headline text-xl mb-2">Arcane Mana</h3>
              <p className="text-sm text-muted-foreground">Master the mana progression from 1 to 6. Every decision counts.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <h3 className="text-primary font-headline text-xl mb-2">Unique Minions</h3>
              <p className="text-sm text-muted-foreground">18 specialized units with distinct move and attack patterns.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <h3 className="text-primary font-headline text-xl mb-2">Tactical Depth</h3>
              <p className="text-sm text-muted-foreground">Protect your Villager at all costs. Outsmart the AI opponent.</p>
            </div>
          </div>
        </main>

        <RulesDialog open={showRules} onOpenChange={setShowRules} />
      </div>
    );
  }

  if (phase === 'deck') {
    return <DeckBuilder onComplete={startGame} />;
  }

  return <CheggGame playerDeck={playerDeck} />;
}
