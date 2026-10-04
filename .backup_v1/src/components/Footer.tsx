import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="pt-12 pb-8 text-center space-y-2.5 border-t border-brand-border">
      <p className="text-[10px] font-mono tracking-widest uppercase text-text-secondary dark:text-slate-300 font-semibold">
        © 2026 Sala Prove Tracker. Tutti i diritti riservati.
      </p>
      <p className="text-[9px] font-medium tracking-tight text-text-secondary dark:text-slate-400">
        È vietata la riproduzione del codice e della grafica.
      </p>
      <p className="text-[11px] font-display font-bold italic text-brand-green">
        Fatto con 🤘🏼 da Alessandro Cortinovis per i veri musicisti.
      </p>
    </footer>
  );
};
