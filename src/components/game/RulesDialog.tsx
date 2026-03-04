"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Sword, Shield, Coins, Move } from "lucide-react";

interface RulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RulesDialog({ open, onOpenChange }: RulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-headline flex items-center gap-2">
            <Zap className="text-primary fill-primary w-6 h-6" />
            Master Rulebook
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Learn the mechanics of CHEGG Arcane Warfare.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-8 py-4">
            <section className="space-y-3">
              <h3 className="text-xl font-headline flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" /> The Objective
              </h3>
              <p className="text-zinc-300 leading-relaxed">
                Protect your <span className="text-white font-bold">Villager</span> (King) at all costs. The game ends immediately when a Villager is eliminated. You win by striking down the opponent's Villager first.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-headline flex items-center gap-2 text-primary">
                <Coins className="w-5 h-5" /> Mana & Resources
              </h3>
              <ul className="space-y-2 text-zinc-300 list-disc pl-5">
                <li>Players start with <span className="text-white">1 Mana</span> on Turn 1.</li>
                <li>Maximum Mana increases by <span className="text-white">+1 each turn</span>, capping at <span className="text-white">6 Mana</span>.</li>
                <li>Mana refreshes every turn. Use it to spawn units, dash, or perform special attacks.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-headline flex items-center gap-2 text-primary">
                <Move className="w-5 h-5" /> Movement & Action
              </h3>
              <ul className="space-y-2 text-zinc-300 list-disc pl-5">
                <li><span className="text-white font-bold">Standard Move:</span> Every unit gets 1 free move per turn.</li>
                <li><span className="text-white font-bold">Dash:</span> A second move costs 1 Mana (Villager Dash costs 2).</li>
                <li><span className="text-white font-bold">Spawn Sickness:</span> Newly spawned units cannot move or attack until the following turn.</li>
                <li><span className="text-white font-bold">Combo Rule:</span> A unit cannot Dash and Attack in the same turn. No movement is allowed after an attack.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-headline flex items-center gap-2 text-primary">
                <Sword className="w-5 h-5" /> Combat
              </h3>
              <ul className="space-y-2 text-zinc-300 list-disc pl-5">
                <li>Attacking costs <span className="text-white">1 Mana</span> (Wither costs 2).</li>
                <li>Units have unique attack patterns. Most units are eliminated in one hit, but the <span className="text-white">Wither</span> has 3 HP.</li>
                <li>Check unit descriptions in the Deck Builder for specific ranges and AoE effects.</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
