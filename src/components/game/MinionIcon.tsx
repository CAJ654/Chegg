import React from 'react';

export function MinionIcon({ type, className }: { type: string, className?: string }) {
  const SvgWrapper = ({ children }: { children: React.ReactNode }) => (
    <svg 
      viewBox="0 0 16 16" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );

  switch (type) {
    case "Villager":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#BD8E72" />
          <rect x="4" y="6" width="2" height="2" fill="black" />
          <rect x="10" y="6" width="2" height="2" fill="black" />
          <rect x="7" y="8" width="2" height="4" fill="#8C634F" />
        </SvgWrapper>
      );
    case "Zombie":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#4B9145" />
          <rect x="4" y="6" width="2" height="2" fill="black" />
          <rect x="10" y="6" width="2" height="2" fill="black" />
          <rect x="5" y="10" width="6" height="2" fill="#2E5C2A" />
        </SvgWrapper>
      );
    case "Creeper":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#00FF00" />
          <rect x="4" y="5" width="2" height="2" fill="black" />
          <rect x="10" y="5" width="2" height="2" fill="black" />
          <rect x="6" y="7" width="4" height="3" fill="black" />
          <rect x="5" y="9" width="2" height="3" fill="black" />
          <rect x="9" y="9" width="2" height="3" fill="black" />
        </SvgWrapper>
      );
    case "Pig":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#F0A1B5" />
          <rect x="4" y="8" width="8" height="4" fill="#E07A94" />
          <rect x="5" y="9" width="2" height="2" fill="#6B3A46" />
          <rect x="9" y="9" width="2" height="2" fill="#6B3A46" />
          <rect x="3" y="6" width="2" height="2" fill="black" />
          <rect x="11" y="6" width="2" height="2" fill="black" />
        </SvgWrapper>
      );
    case "Rabbit":
      return (
        <SvgWrapper>
          <rect x="5" y="6" width="6" height="6" fill="#A67C52" />
          <rect x="5" y="2" width="2" height="4" fill="#A67C52" />
          <rect x="9" y="2" width="2" height="4" fill="#A67C52" />
          <rect x="6" y="8" width="1" height="1" fill="black" />
          <rect x="9" y="8" width="1" height="1" fill="black" />
        </SvgWrapper>
      );
    case "Puffer-Fish":
      return (
        <SvgWrapper>
          <rect x="4" y="4" width="8" height="8" fill="#F0C42D" />
          <rect x="7" y="2" width="2" height="2" fill="#F0C42D" />
          <rect x="7" y="12" width="2" height="2" fill="#F0C42D" />
          <rect x="2" y="7" width="2" height="2" fill="#F0C42D" />
          <rect x="12" y="7" width="2" height="2" fill="#F0C42D" />
          <rect x="5" y="7" width="1" height="1" fill="black" />
          <rect x="10" y="7" width="1" height="1" fill="black" />
        </SvgWrapper>
      );
    case "Iron Golem":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#D1D1D1" />
          <rect x="6" y="7" width="4" height="1" fill="#FF0000" />
          <rect x="7" y="8" width="2" height="4" fill="#A1A1A1" />
        </SvgWrapper>
      );
    case "Frog":
      return (
        <SvgWrapper>
          <rect x="3" y="6" width="10" height="7" fill="#668B2F" />
          <rect x="4" y="3" width="3" height="3" fill="#668B2F" />
          <rect x="9" y="3" width="3" height="3" fill="#668B2F" />
          <rect x="5" y="4" width="1" height="1" fill="black" />
          <rect x="10" y="4" width="1" height="1" fill="black" />
        </SvgWrapper>
      );
    case "Skeleton":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#D1D1D1" />
          <rect x="4" y="6" width="3" height="2" fill="#4B4B4B" />
          <rect x="9" y="6" width="3" height="2" fill="#4B4B4B" />
          <rect x="6" y="10" width="4" height="2" fill="#4B4B4B" />
        </SvgWrapper>
      );
    case "Blaze":
      return (
        <SvgWrapper>
          <rect x="4" y="4" width="8" height="8" fill="#E69112" />
          <rect x="1" y="2" width="2" height="6" fill="#F7DC31" />
          <rect x="13" y="8" width="2" height="6" fill="#F7DC31" />
          <rect x="6" y="7" width="1" height="1" fill="black" />
          <rect x="9" y="7" width="1" height="1" fill="black" />
        </SvgWrapper>
      );
    case "Phantom":
      return (
        <SvgWrapper>
          <rect x="2" y="6" width="12" height="4" fill="#404B7A" />
          <rect x="6" y="4" width="4" height="2" fill="#404B7A" />
          <rect x="7" y="5" width="2" height="1" fill="#99FF00" />
        </SvgWrapper>
      );
    case "Enderman":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#161616" />
          <rect x="3" y="7" width="3" height="1" fill="#E125FF" />
          <rect x="10" y="7" width="3" height="1" fill="#E125FF" />
        </SvgWrapper>
      );
    case "Slime":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#78C663" opacity="0.6" />
          <rect x="4" y="4" width="8" height="8" fill="#58A843" />
          <rect x="5" y="6" width="2" height="2" fill="#2E5C2A" />
          <rect x="9" y="6" width="2" height="2" fill="#2E5C2A" />
          <rect x="7" y="10" width="2" height="1" fill="#2E5C2A" />
        </SvgWrapper>
      );
    case "Shulker-Box":
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#976797" />
          <rect x="4" y="4" width="8" height="8" fill="#F2C8F2" opacity="0.4" />
          <rect x="6" y="7" width="1" height="1" fill="white" />
          <rect x="9" y="7" width="1" height="1" fill="white" />
        </SvgWrapper>
      );
    case "Parrot":
      return (
        <SvgWrapper>
          <rect x="5" y="4" width="6" height="10" fill="#FF0000" />
          <rect x="6" y="6" width="1" height="1" fill="white" />
          <rect x="9" y="6" width="1" height="1" fill="white" />
          <rect x="7" y="8" width="2" height="2" fill="#EBD61C" />
        </SvgWrapper>
      );
    case "Cat":
      return (
        <SvgWrapper>
          <rect x="3" y="5" width="10" height="8" fill="#F0E130" />
          <rect x="3" y="3" width="2" height="2" fill="#F0E130" />
          <rect x="11" y="3" width="2" height="2" fill="#F0E130" />
          <rect x="5" y="7" width="1" height="1" fill="#5D9F3F" />
          <rect x="10" y="7" width="1" height="1" fill="#5D9F3F" />
          <rect x="7" y="9" width="2" height="1" fill="#F593A1" />
        </SvgWrapper>
      );
    case "Sniffer":
      return (
        <SvgWrapper>
          <rect x="2" y="4" width="12" height="10" fill="#7F1C1C" />
          <rect x="2" y="2" width="12" height="4" fill="#166534" />
          <rect x="6" y="10" width="4" height="4" fill="#FACC15" />
        </SvgWrapper>
      );
    case "Wither":
      return (
        <SvgWrapper>
          <rect x="5" y="2" width="6" height="6" fill="#222222" />
          <rect x="1" y="6" width="5" height="5" fill="#222222" />
          <rect x="10" y="6" width="5" height="5" fill="#222222" />
          <rect x="2" y="8" width="1" height="1" fill="white" />
          <rect x="4" y="8" width="1" height="1" fill="white" />
          <rect x="7" y="4" width="1" height="1" fill="white" />
          <rect x="9" y="4" width="1" height="1" fill="white" />
          <rect x="11" y="8" width="1" height="1" fill="white" />
          <rect x="13" y="8" width="1" height="1" fill="white" />
        </SvgWrapper>
      );
    default:
      return (
        <SvgWrapper>
          <rect x="2" y="2" width="12" height="12" fill="#888888" />
        </SvgWrapper>
      );
  }
}
