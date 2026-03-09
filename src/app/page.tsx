"use client";

import { useState } from "react";
import { DeckBuilder } from "@/components/game/DeckBuilder";
import { CheggGame } from "@/components/game/CheggGame";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sword, ExternalLink } from "lucide-react";

export default function Home() {
  const [phase, setPhase] = useState<'landing' | 'deckBlue' | 'deckRed' | 'game'>('landing');
  const [blueDeck, setBlueDeck] = useState<string[]>([]);
  const [redDeck, setRedDeck] = useState<string[]>([]);

  const startDeckBuilding = () => setPhase('deckBlue');
  
  const completeBlueDeck = (deck: string[]) => {
    setBlueDeck(deck);
    setPhase('deckRed');
  };

  const completeRedDeck = (deck: string[]) => {
    setRedDeck(deck);
    setPhase('game');
  };

  const openRulebook = () => {
    window.open('https://docs.google.com/document/d/1TM736HhNsh2nz8l3L-a6PuWAVxbnBSF__NB7qX7Wdlw/edit?usp=sharing', '_blank');
  };

  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#221D25] py-12">
        {/* Background glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-secondary/10 blur-[120px]" />

        <main className="z-10 text-center px-6 max-w-4xl w-full">
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-headline text-white mb-6 tracking-tighter leading-none animate-in fade-in duration-1000">
            CHEGG
          </h1>
          
          <p className="text-lg md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 px-4">
            A strategic chess-inspired battleground where mana flow and minion positioning decide the fate of kingdoms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center animate-in fade-in zoom-in-95 duration-1000 delay-500 px-4">
            <Button size="lg" className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-headline rounded-2xl w-full sm:w-auto" onClick={startDeckBuilding}>
              <Sword className="mr-3 w-5 h-5 md:w-6 md:h-6" /> Enter Arena
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-headline rounded-2xl w-full sm:w-auto"
              onClick={openRulebook}
            >
              <ShieldCheck className="mr-3 w-5 h-5 md:w-6 md:h-6" /> How to Play
            </Button>
          </div>

          <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <h3 className="text-primary font-headline text-lg md:text-xl mb-2">Unique Minions</h3>
              <p className="text-xs md:text-sm text-muted-foreground">18 specialized units with distinct move and attack patterns.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <h3 className="text-primary font-headline text-lg md:text-xl mb-2">Credits</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Rules made by Gerg - {" "}
                <a 
                  href="https://youtube.com/@_gerg?si=nRy82bCPkNZAV9M_" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (phase === 'deckBlue') {
    return <DeckBuilder playerColor="Blue" onComplete={completeBlueDeck} key="deck-blue" />;
  }

  if (phase === 'deckRed') {
    return <DeckBuilder playerColor="Red" onComplete={completeRedDeck} key="deck-red" />;
  }

  return <CheggGame blueDeck={blueDeck} redDeck={redDeck} />;
}
