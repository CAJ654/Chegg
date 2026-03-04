import { 
  User, 
  Skull, 
  Bomb, 
  Dog, 
  Rabbit as RabbitIcon, 
  Fish, 
  ShieldAlert, 
  Bird, 
  Target, 
  Flame, 
  Ghost, 
  Dna, 
  Square, 
  Box, 
  Cat, 
  Search, 
  CloudLightning,
  Spline
} from "lucide-react";

export function MinionIcon({ type, className }: { type: string, className?: string }) {
  switch (type) {
    case "Villager": return <User className={className} />;
    case "Zombie": return <Skull className={className} />;
    case "Creeper": return <Bomb className={className} />;
    case "Pig": return <Dog className={className} />;
    case "Rabbit": return <RabbitIcon className={className} />;
    case "Puffer-Fish": return <Fish className={className} />;
    case "Iron Golem": return <ShieldAlert className={className} />;
    case "Frog": return <Spline className={className} />;
    case "Skeleton": return <Target className={className} />;
    case "Blaze": return <Flame className={className} />;
    case "Phantom": return <Ghost className={className} />;
    case "Enderman": return <Dna className={className} />;
    case "Slime": return <div className={`rounded-full bg-green-500/40 w-full h-full border-2 border-green-400 ${className}`} />;
    case "Shulker-Box": return <Box className={className} />;
    case "Parrot": return <Bird className={className} />;
    case "Cat": return <Cat className={className} />;
    case "Sniffer": return <Search className={className} />;
    case "Wither": return <CloudLightning className={className} />;
    default: return <User className={className} />;
  }
}