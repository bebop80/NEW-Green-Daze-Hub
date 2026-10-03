import React, { useState } from 'react';
import { 
  Trophy, 
  X, 
  Calendar, 
  MapPin, 
  Trash2, 
  AlertTriangle,
  Flame,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isFuture, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Concert } from '../../types';
import { safeParseLocal } from '../../lib/utils';

interface PastConcertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData | null;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const PastConcertsModal: React.FC<PastConcertsModalProps> = ({
  isOpen,
  onClose,
  data,
  apiAction
}) => {
  const [concertToDelete, setConcertToDelete] = useState<Concert | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const sortedConcerts = [...(data?.concerts || [])].sort(
    (a, b) => safeParseLocal(a.date).getTime() - safeParseLocal(b.date).getTime()
  );

  const pastConcerts = sortedConcerts.filter(
    c => !isFuture(safeParseLocal(c.date)) && !isToday(safeParseLocal(c.date))
  ).reverse();

  const handleConfirmDelete = async () => {
    if (!concertToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const ok = await apiAction('delete_concert', { id: concertToDelete.id });
      if (ok) setConcertToDelete(null);
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
            <Trophy size={18} className="text-brand-green" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-text-primary">
              Archivio Live Suonati
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-dark border border-brand-border text-brand-green">
              {pastConcerts.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-dark text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* List of past concerts */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {pastConcerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              Nessun concerto archiviato finora.
            </div>
          ) : (
            pastConcerts.map((c) => (
              <div
                key={c.id}
                className="bg-brand-dark/90 border border-brand-border/70 rounded-xl p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display font-black text-sm text-text-primary uppercase truncate">
                      {c.name}
                    </h4>
                    <span className="text-[11px] font-mono text-brand-green font-bold block">
                      {format(safeParseLocal(c.date), 'EEEE d MMMM yyyy', { locale: it })}
                    </span>
                  </div>

                  <button
                    onClick={() => setConcertToDelete(c)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer shrink-0"
                    title="Elimina dall'archivio"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {c.address && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <MapPin size={12} className="text-brand-green shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}

                {c.notes && (
                  <div className="text-[11px] text-text-secondary/90 italic bg-brand-card/50 p-2 rounded-lg border border-brand-border/40">
                    "{c.notes}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Confirm Delete Banner */}
        {concertToDelete && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-between gap-2 flex-shrink-0 mt-2">
            <div className="text-xs text-red-400 font-bold truncate">
              Eliminare "{concertToDelete.name}"?
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-bold uppercase cursor-pointer"
              >
                {isDeleting ? '...' : 'Sì, Elimina'}
              </button>
              <button
                onClick={() => setConcertToDelete(null)}
                className="px-2.5 py-1 rounded-lg bg-brand-dark text-text-secondary text-xs border border-brand-border cursor-pointer"
              >
                No
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
