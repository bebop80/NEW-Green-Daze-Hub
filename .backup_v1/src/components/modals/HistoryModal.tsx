import React, { useState, useMemo } from 'react';
import { History, X, Trash2, AlertTriangle, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData } from '../../types';
import { safeParseLocal } from '../../lib/utils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData | null;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  data,
  apiAction
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const allPayments = (data?.payments || []).slice().reverse();

  const filteredPayments = allPayments.filter(p => {
    if (selectedFilter === 'ALL') return true;
    return p.payer === selectedFilter;
  });

  const filterOptions = [
    { label: 'Tutti', value: 'ALL' },
    ...(data?.members || []).map(m => ({ label: m.name, value: m.name })),
    ...(allPayments.some(p => p.payer === 'Spesa condivisa') 
      ? [{ label: 'Condivisi', value: 'Spesa condivisa' }] 
      : [])
  ];

  const handleDeleteLast = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const ok = await apiAction('delete_last', {});
      if (ok) setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md max-h-[85vh] glass-card border border-brand-green/30 bg-brand-card p-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History size={18} className="text-brand-green" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-text-primary">
              Storico Pagamenti
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-dark border border-brand-border text-brand-green">
              {allPayments.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-dark text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === opt.value
                  ? 'bg-brand-green text-black shadow-xs font-black'
                  : 'bg-brand-dark border border-brand-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Payment Items List */}
        <div className="flex-1 overflow-y-auto py-1 space-y-1.5 min-h-[180px]">
          {filteredPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              Nessun pagamento registrato per questo filtro.
            </div>
          ) : (
            filteredPayments.map((p, idx) => {
              const memberObj = data?.members.find(m => m.name === p.payer);
              const isShared = p.payer === 'Spesa condivisa';

              return (
                <div
                  key={idx}
                  className="bg-brand-dark/80 border border-brand-border/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: isShared ? '#00e660' : (memberObj?.color || '#94a3b8') }}
                    />
                    <div className="min-w-0">
                      <span 
                        className="font-display font-black text-xs uppercase block truncate"
                        style={{ color: isShared ? '#00e660' : memberObj?.color }}
                      >
                        {p.payer}
                      </span>
                      <span className="text-[10px] font-mono text-text-secondary block">
                        {format(safeParseLocal(p.date), 'EEEE d MMMM yyyy', { locale: it })}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-brand-card border border-brand-border text-[10px] font-mono font-bold text-text-secondary shrink-0">
                    Prova {allPayments.length - idx}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Last Payment Footer */}
        <div className="pt-2.5 border-t border-brand-border/50 flex-shrink-0">
          {showConfirmDelete ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
                <AlertTriangle size={15} />
                <span>Eliminare l'ultimo pagamento?</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDeleteLast}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase cursor-pointer"
                >
                  {isDeleting ? '...' : 'Sì, Elimina'}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2 py-1 rounded-lg bg-brand-dark text-text-secondary text-xs border border-brand-border cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            allPayments.length > 0 && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="w-full py-2 rounded-xl bg-brand-dark/70 hover:bg-red-500/10 text-text-secondary hover:text-red-400 border border-brand-border hover:border-red-500/30 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Elimina Ultimo Pagamento</span>
              </button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};
