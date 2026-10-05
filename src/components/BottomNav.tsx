import React from 'react';
import { Flame, Music, Wallet, Ticket } from 'lucide-react';
import { cn } from '../lib/utils';

export type TabType = 'home' | 'prove' | 'pagamenti' | 'concerti';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  nextHasNotes?: boolean;
  upcomingConcertsCount?: number;
  availableMembersCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  nextHasNotes,
  upcomingConcertsCount = 0,
  availableMembersCount = 0
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
      badge: availableMembersCount > 0 ? String(availableMembersCount) : null
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
    <nav className="relative z-30 flex-shrink-0 bg-white/95 dark:bg-[#0f1219]/95 border-t border-slate-200 dark:border-white/[0.08] backdrop-blur-lg px-2 pt-1.5 pb-2.5 sm:pb-3 transition-colors shadow-md dark:shadow-none">
      <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer select-none",
                isActive 
                  ? "bg-emerald-600/10 dark:bg-[#00e660]/15 text-emerald-800 dark:text-[#00e660] border border-emerald-600/30 dark:border-[#00e660]/50 shadow-xs dark:shadow-[0_0_14px_rgba(0,230,96,0.3)]" 
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent"
              )}
            >
              {/* Rock icon with active glow */}
              <div className="relative">
                <Icon 
                  size={22} 
                  className={cn(
                    "transition-transform duration-200", 
                    isActive ? "scale-110 text-emerald-700 dark:text-[#00e660] dark:drop-shadow-[0_0_10px_#00e660]" : "opacity-75"
                  )} 
                />

                {/* Badge */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-mono font-bold bg-emerald-600 dark:bg-[#00e660] text-white dark:text-black rounded-full leading-none shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Punk rock label */}
              <span 
                className={cn(
                  "text-[11px] sm:text-xs font-rock tracking-wider uppercase mt-1 leading-none",
                  isActive ? "text-emerald-800 dark:text-[#00e660] font-bold dark:glow-green" : "text-slate-600 dark:text-zinc-400 font-medium"
                )}
              >
                {tab.label}
              </span>

              {/* Active neon bottom dash */}
              {isActive && (
                <div className="absolute bottom-1 w-7 h-0.5 rounded-full bg-emerald-600 dark:bg-[#00e660] dark:shadow-[0_0_8px_#00e660]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
