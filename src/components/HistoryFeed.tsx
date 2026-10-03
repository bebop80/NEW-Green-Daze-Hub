import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { History, ChevronUp, ChevronDown, Trash2, Filter, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData } from '../types';
import { cn, safeParseLocal } from '../lib/utils';

interface HistoryFeedProps {
  data: AppData | null;
  isHistoryExpanded: boolean;
  setIsHistoryExpanded: (val: boolean) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const HistoryFeed: React.FC<HistoryFeedProps> = ({
  data,
  isHistoryExpanded,
  setIsHistoryExpanded,
  apiAction
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const handleDeleteLast = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await apiAction('delete_last', {});
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const allPayments = useMemo(() => {
    return (data?.payments || []).slice().reverse();
  }, [data?.payments]);

  const filteredPayments = useMemo(() => {
    if (selectedFilter === 'ALL') return allPayments;
    return allPayments.filter(p => p.payer === selectedFilter);
  }, [allPayments, selectedFilter]);

  const filterOptions = useMemo(() => {
    const list = [{ label: 'Tutti', value: 'ALL' }];
    (data?.members || []).forEach(m => {
      list.push({ label: m.name, value: m.name });
    });
    const hasShared = allPayments.some(p => p.payer === 'Spesa condivisa');
    if (hasShared) {
      list.push({ label: 'Condivisi', value: 'Spesa condivisa' });
    }
    return list;
  }, [data?.members, allPayments]);

  return (
    <section 
      className={cn(
        "glass-card transition-all duration-200 overflow-hidden",
        isHistoryExpanded ? "border-brand-green/30 shadow-xl" : "border-brand-green/10"
      )}
    >
      <div 
        className={cn(
          "h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between cursor-pointer group select-none transition-colors",
          isHistoryExpanded ? "bg-brand-green/5 border-b border-brand-border/60" : "hover:bg-white/[0.02]"
        )}
        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
          <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
            Storico Pagamenti
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-dark border border-brand-border text-text-secondary shrink-0">
            {allPayments.length}
          </span>
        </div>
        <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
          {isHistoryExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      
      <AnimatePresence>
        {isHistoryExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 overflow-hidden"
          >
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-[10px] font-mono font-bold uppercase text-text-secondary mr-1 flex items-center gap-1 shrink-0">
                <Filter size={11} className="text-brand-green" />
                Filtra:
              </span>
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFilter(opt.value);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer border",
                    selectedFilter === opt.value
                      ? "bg-brand-green text-black border-brand-green shadow-sm"
                      : "bg-brand-dark/70 text-text-secondary border-brand-border/60 hover:text-text-primary hover:border-brand-green/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* List of ALL payments with rich items */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredPayments.map((p, idx) => {
                const dateObj = safeParseLocal(p.date);
                const memberObj = data?.members.find(m => m.name === p.payer);
                const isShared = p.payer === 'Spesa condivisa';
                const color = isShared ? '#00e660' : (memberObj?.color || '#00e660');
                const paymentNum = allPayments.length - allPayments.indexOf(p);

                return (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center py-2.5 px-3 bg-brand-dark/50 border border-brand-border/40 hover:border-brand-border rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 w-6">
                        #{paymentNum}
                      </span>
                      <span className="font-mono text-xs uppercase font-bold text-text-primary">
                        {format(dateObj, 'd MMMM yyyy', { locale: it })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className="font-bold text-xs tracking-wider uppercase px-2 py-0.5 rounded-md border font-display"
                        style={{ 
                          color: color,
                          borderColor: `${color}40`,
                          backgroundColor: `${color}15`
                        }}
                      >
                        {isShared ? '🤝 Spesa condivisa' : p.payer}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredPayments.length === 0 && (
                <p className="text-center text-xs text-text-secondary uppercase py-6 font-mono border border-dashed border-brand-border rounded-xl">
                  Nessun pagamento registrato con i filtri selezionati
                </p>
              )}
            </div>

            {/* Delete Last Payment Safe Action */}
            {allPayments.length > 0 && (
              <div className="pt-2 border-t border-brand-border/60">
                {showConfirmDelete ? (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2.5">
                    <p className="text-xs font-bold text-red-400 text-center flex items-center justify-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      Confermi l'annullamento dell'ultimo versamento registrato?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowConfirmDelete(false)}
                        className="flex-1 min-h-[40px] bg-brand-dark border border-brand-border rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        Annulla
                      </button>
                      <button 
                        disabled={isDeleting}
                        onClick={handleDeleteLast}
                        className="flex-1 min-h-[40px] bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isDeleting ? 'Eliminazione...' : 'Sì, Elimina Ultimo'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowConfirmDelete(true)}
                    className="w-full min-h-[40px] py-2.5 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-red-500/5 hover:bg-red-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={15} />
                    Annulla Ultimo Versamento
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
