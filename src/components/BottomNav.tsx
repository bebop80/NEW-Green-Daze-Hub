import React from 'react';
import { Flame, Music, Wallet, Ticket, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export type TabType = 'home' | 'prove' | 'pagamenti' | 'concerti';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  nextHasNotes?: boolean;
  upcomingConcertsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  nextHasNotes,
  upcomingConcertsCount = 0
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'HOME',
      icon: Flame,
      badge: nextHasNotes ? '•' : null
    },
    {
      id: 'prove' as TabType,
      label: 'PROVE',
      icon: Music,
      badge: null
    },
    {
      id: 'pagamenti' as TabType,
      label: 'PAGAMENTI',
      icon: Wallet,
      badge: null
    },
    {
      id: 'concerti' as TabType,
      label: 'CONCERTI',
      icon: Ticket,
      badge: upcomingConcertsCount > 0 ? String(upcomingConcertsCount) : null
    }
  ];

  return (
    <nav className="relative z-30 flex-shrink-0 bg-brand-dark/95 border-t border-brand-border/60 backdrop-blur-lg px-2 pt-1.5 pb-2.5 sm:pb-3">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 sm:gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer select-none",
                isActive 
                  ? "bg-brand-green/15 text-brand-green border border-brand-green/40 shadow-[0_0_12px_rgba(0,230,96,0.25)]" 
                  : "text-text-secondary hover:text-text-primary hover:bg-brand-card/40 border border-transparent"
              )}
            >
              {/* Rock icon with active glow */}
              <div className="relative">
                <Icon 
                  size={20} 
                  className={cn(
                    "transition-transform duration-200", 
                    isActive ? "scale-110 drop-shadow-[0_0_8px_#00e660]" : "opacity-80"
                  )} 
                />

                {/* Optional mini badge */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 flex items-center justify-center text-[9px] font-mono font-bold bg-brand-green text-black rounded-full leading-none shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Punk rock label */}
              <span 
                className={cn(
                  "text-[10px] sm:text-[11px] font-display font-extrabold tracking-wider uppercase mt-1 leading-none",
                  isActive ? "text-brand-green font-black" : "text-text-secondary"
                )}
              >
                {tab.label}
              </span>

              {/* Active neon bottom dash */}
              {isActive && (
                <div className="absolute bottom-0.5 w-6 h-0.5 rounded-full bg-brand-green shadow-[0_0_8px_#00e660]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
