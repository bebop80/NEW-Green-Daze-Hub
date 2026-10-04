import React from 'react';
import { Sun, Moon, RefreshCcw } from 'lucide-react';

interface AppHeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  lastSync: string;
  onOpenSettings?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  theme,
  toggleTheme,
  lastSync
}) => {
  return (
    <header className="relative z-20 flex-shrink-0 px-3 sm:px-4 pt-2.5 pb-2 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0f1219]/95 backdrop-blur-md transition-colors">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Left: Theme toggle (Light / Dark mode) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
          aria-label="Cambia tema chiaro/scuro"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] hover:border-emerald-600 dark:hover:border-brand-green/60 text-slate-700 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-brand-green transition-all cursor-pointer active:scale-95 shrink-0 shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-brand-green" />
          ) : (
            <Moon size={17} className="text-emerald-700" />
          )}
        </button>

        {/* Center: Band name centered, strictly on ONE single line */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1 text-center">
          <span className="whitespace-nowrap font-['Verdana'] font-bold not-italic text-2xl sm:text-3xl tracking-wider text-emerald-700 dark:text-brand-green dark:glow-green uppercase select-none leading-none drop-shadow-xs dark:drop-shadow-none">
            GREEN DAZE
          </span>
        </div>

        {/* Right: Sync indicator (conveniently positioned and balanced with left toggle) */}
        <div 
          title={`Ultima sincronizzazione: ${lastSync}`}
          className="h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-400 select-none shrink-0 shadow-xs"
        >
          <RefreshCcw size={12} className="text-emerald-600 dark:text-brand-green animate-spin" />
          <span className="hidden xs:inline">{lastSync}</span>
        </div>
      </div>
    </header>
  );
};
