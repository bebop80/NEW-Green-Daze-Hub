import React from 'react';
import { Sun, Eye, Settings, RefreshCcw } from 'lucide-react';

interface AppHeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  lastSync: string;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  theme,
  toggleTheme,
  lastSync,
  onOpenSettings
}) => {
  return (
    <header className="relative z-20 flex-shrink-0 px-3 pt-2 pb-1 border-b border-brand-border/40 bg-brand-dark/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Left: Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
          aria-label="Cambia tema chiaro/scuro"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-card/80 border border-brand-border/60 hover:border-brand-green/60 text-text-secondary hover:text-brand-green transition-all cursor-pointer active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-brand-green" />
          ) : (
            <Eye size={16} className="text-brand-green" />
          )}
        </button>

        {/* Center: Band name horizontal */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-display font-black text-xl sm:text-2xl tracking-tighter text-brand-green uppercase drop-shadow-[0_0_12px_rgba(0,230,96,0.35)] select-none">
              GREEN DAZE
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block shadow-[0_0_6px_#00e660]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block shadow-[0_0_6px_#00e660]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block shadow-[0_0_6px_#00e660]" />
            </div>
          </div>
        </div>

        {/* Right: Sync indicator + Settings Gear */}
        <div className="flex items-center gap-1.5">
          <div 
            title={`Ultima sincronizzazione: ${lastSync}`}
            className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-card/60 border border-brand-border/50 text-[10px] font-mono text-text-secondary"
          >
            <RefreshCcw size={10} className="text-brand-green animate-spin" />
            <span>{lastSync}</span>
          </div>

          <button
            onClick={onOpenSettings}
            title="Impostazioni Band"
            aria-label="Apri impostazioni band"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-card/80 border border-brand-border/60 hover:border-brand-green/60 text-text-secondary hover:text-brand-green transition-all cursor-pointer active:scale-95"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
