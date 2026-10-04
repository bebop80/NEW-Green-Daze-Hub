import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronUp, ChevronDown, MapPin, Trash2 } from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Concert } from '../types';
import { cn, safeParseLocal } from '../lib/utils';

interface PastConcertsArchiveProps {
  data: AppData | null;
  apiAction?: (type: string, payload: any) => Promise<boolean>;
  setShowAddConcert?: (val: boolean) => void;
  setConcertForm?: (val: any) => void;
}

export const PastConcertsArchive: React.FC<PastConcertsArchiveProps> = ({
  data,
  apiAction
}) => {
  const [showPastArchive, setShowPastArchive] = useState(false);
  const [concertToDelete, setConcertToDelete] = useState<Concert | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedConcerts = [...(data?.concerts || [])].sort(
    (a, b) => safeParseLocal(a.date).getTime() - safeParseLocal(b.date).getTime()
  );

  const past = sortedConcerts.filter(
    c => !isFuture(safeParseLocal(c.date)) && !isToday(safeParseLocal(c.date))
  ).reverse();

  const handleConfirmDelete = async () => {
    if (!concertToDelete || isDeleting || !apiAction) return;
    setIsDeleting(true);
    try {
      const success = await apiAction('delete_concert', { id: concertToDelete.id });
      if (success) {
        setConcertToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section 
      className={cn(
        "glass-card transition-all duration-200 overflow-hidden",
        showPastArchive ? "border-brand-green/30 shadow-xl" : "border-brand-green/10"
      )}
    >
      <div 
        className={cn(
          "h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between cursor-pointer group select-none transition-colors",
          showPastArchive ? "bg-brand-green/5 border-b border-brand-border/60" : "hover:bg-white/[0.02]"
        )}
        onClick={() => setShowPastArchive(!showPastArchive)}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
          <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
            Storico Concerti
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-dark border border-brand-border text-text-secondary shrink-0">
            {past.length} {past.length === 1 ? 'Live' : 'Live'}
          </span>
        </div>

        <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
          {showPastArchive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      <AnimatePresence>
        {showPastArchive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 space-y-2.5">
              {past.length > 0 ? (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {past.map(c => {
                    const dateObj = safeParseLocal(c.date);
                    return (
                      <div 
                        key={c.id}
                        className="p-3 bg-brand-dark/40 border border-brand-border/50 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-mono text-[10px] font-bold text-zinc-500 uppercase">
                            {format(dateObj, 'd MMMM yyyy', { locale: it })}
                          </div>
                          <div className="font-display font-bold text-text-primary truncate">
                            {c.name}
                          </div>
                          {c.address && (
                            <div className="text-[11px] text-text-secondary truncate flex items-center gap-1">
                              <MapPin size={11} className="shrink-0 text-zinc-500" />
                              <span>{c.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {c.cachet && (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              {c.cachet}
                            </span>
                          )}
                          <button
                            onClick={() => setConcertToDelete(c)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Elimina concerto dallo storico"
                            aria-label="Elimina concerto dallo storico"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs font-mono text-zinc-500 uppercase border border-dashed border-brand-border rounded-xl">
                  Nessun concerto nell'archivio storico
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Popup */}
      <AnimatePresence>
        {concertToDelete && (
          <div 
            className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isDeleting && setConcertToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-xs bg-brand-card/95 border border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-3.5 text-center relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
                <Trash2 size={22} />
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-black text-sm uppercase tracking-tight text-white">
                  Eliminare questo concerto?
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed px-1">
                  Stai per eliminare dallo storico il concerto{' '}
                  <span className="text-white font-bold">{concertToDelete.name}</span> del{' '}
                  <span className="text-brand-green font-mono font-bold">
                    {format(safeParseLocal(concertToDelete.date), 'd MMMM yyyy', { locale: it })}
                  </span>. L'operazione è irreversibile.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConcertToDelete(null)}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-brand-dark/80 hover:bg-brand-dark border border-brand-border/70 text-text-secondary hover:text-text-primary transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Elimino...</span>
                    </>
                  ) : (
                    <span>Elimina</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
