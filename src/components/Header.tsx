import React from 'react';
import { RefreshCcw, Sun, Eye } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  lastSync: string;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, lastSync }) => {
  return (
    <header className="relative pt-0 pb-1">
      {/* Top discreet utilities bar: Theme Toggle on left, System Sync status on right */}
      <div className="flex items-center justify-between gap-2 mb-1 w-full">
        <button 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
          aria-label="Cambia tema chiaro/scuro"
          className="flex items-center gap-1.5 text-text-secondary hover:text-brand-green transition-colors cursor-pointer text-[11px] font-mono font-medium select-none active:opacity-75"
        >
          {theme === 'dark' ? <Sun size={14} className="text-brand-green" /> : <Eye size={14} className="text-brand-green" />}
          <span className="uppercase tracking-wider">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary/75 select-none text-right">
          <RefreshCcw size={10} className="animate-spin text-brand-green flex-shrink-0" />
          <span className="truncate">SISTEMA ONLINE • SYNC {lastSync}</span>
        </div>
      </div>

      {/* Centered Green Daze Brand Logo */}
      <div className="flex justify-center items-center px-2 pt-2">
        <div className="flex-1 flex justify-center">
          <svg 
            viewBox="0 0 400 260" 
            className="h-36 sm:h-40 md:h-44 w-auto drop-shadow-sm"
            aria-label="Green Daze Logo"
          >
            <defs>
              <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
                .logo-text { 
                  font-family: 'Inter', sans-serif; 
                  font-weight: 900; 
                  letter-spacing: -0.05em;
                }
              `}</style>
            </defs>
            <text 
              x="50%" 
              y="85" 
              textAnchor="middle" 
              className="logo-text fill-brand-green" 
              style={{ fontSize: '110px' }}
            >
              GREEN
            </text>
            <text 
              x="50%" 
              y="185" 
              textAnchor="middle" 
              className="logo-text fill-brand-green" 
              style={{ fontSize: '110px' }}
            >
              DAZE
            </text>
            <circle cx="140" cy="225" r="18" className="fill-brand-green" />
            <circle cx="200" cy="225" r="18" className="fill-brand-green" />
            <circle cx="260" cy="225" r="18" className="fill-brand-green" />
          </svg>
        </div>
      </div>
    </header>
  );
};
