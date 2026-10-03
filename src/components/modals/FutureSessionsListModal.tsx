import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Pencil, 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  ArrowUpCircle,
  AlertTriangle,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, FutureRehearsal } from '../../types';
import { safeParseLocal } from '../../lib/utils';
import { CalendarExportModal, CalendarEventItem } from './CalendarExportModal';

interface FutureSessionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData | null;
  onOpenAddFuture: () => void;
  onEditFuture: (fr: FutureRehearsal) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
  shareInfo: (text: string, platform: 'wa' | 'tg') => void;
}

export const FutureSessionsListModal: React.FC<FutureSessionsListModalProps> = ({
  isOpen,
  onClose,
  data,
  onOpenAddFuture,
  onEditFuture,
  apiAction,
  shareInfo
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [calendarItem, setCalendarItem] = useState<CalendarEventItem | null>(null);

  if (!isOpen) return null;

  const sortedFuture = [...(data?.futureRehearsals || [])].sort(
    (a, b) => safeParseLocal(a.date).getTime() - safeParseLocal(b.date).getTime()
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiAction('delete_future_rehearsal', { id });
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePromoteToNext = async (fr: FutureRehearsal) => {
    setPromotingId(fr.id);
    try {
      const isShared = !!fr.sharedExpense;
      const cleanNotes = (fr.notes || '').replace(/\[SPESA_CONDIVISA\]/g, '').trim();
      const finalNotes = isShared ? `${cleanNotes} [SPESA_CONDIVISA]`.trim() : cleanNotes;

      const payload = {
        date: fr.date,
        from: fr.from || '',
        to: fr.to || '',
        room: fr.room || '',
        notes: finalNotes,
        sharedExpense: isShared
      };

      const success = await apiAction('next_rehearsal', { next: payload });
      if (success) {
        await apiAction('delete_future_rehearsal', { id: fr.id });
      }
    } finally {
      setPromotingId(null);
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
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-brand-border/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-brand-green" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-text-primary">
              Tutte le Prove Future
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-dark border border-brand-border text-brand-green">
              {sortedFuture.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                onOpenAddFuture();
              }}
              className="py-1 px-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black text-xs font-bold uppercase flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>Nuova</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-dark text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {sortedFuture.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Calendar size={28} className="mx-auto text-text-secondary/50" />
              <p className="text-xs uppercase font-mono text-text-secondary font-bold">
                Nessuna prova futura programmata
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddFuture();
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-green text-black text-xs font-bold uppercase"
              >
                + Aggiungi Sessione
              </button>
            </div>
          ) : (
            sortedFuture.map((fr) => {
              const dateObj = safeParseLocal(fr.date);
              const roomObj = data?.customRooms.find(r => r.id === fr.room);

              return (
                <div
                  key={fr.id}
                  className="bg-brand-dark/90 border border-brand-border/70 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display font-black text-sm text-text-primary uppercase text-brand-green">
                        {format(dateObj, 'EEEE d MMMM yyyy', { locale: it })}
                      </div>
                      {(fr.from || fr.to) && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-text-secondary mt-0.5">
                          <Clock size={11} className="text-brand-green" />
                          <span>{fr.from} {fr.to && `— ${fr.to}`}</span>
                        </div>
                      )}
                    </div>

                    {fr.sharedExpense && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-brand-green/20 text-brand-green border border-brand-green/40">
                        Condivisa
                      </span>
                    )}
                  </div>

                  {/* Room */}
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Music size={12} className="text-brand-green shrink-0" />
                    <span className="font-medium text-text-primary truncate">
                      {roomObj?.name || 'Sala da definire'}
                    </span>
                    {roomObj?.address && (
                      <span className="text-[10px] text-text-secondary/80 truncate">
                        • {roomObj.address}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-brand-border/40">
                    <button
                      onClick={() => handlePromoteToNext(fr)}
                      disabled={promotingId === fr.id}
                      className="py-1 px-2 rounded-lg bg-brand-green/15 hover:bg-brand-green/25 text-brand-green border border-brand-green/30 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Imposta come Prossima Prova attiva"
                    >
                      <ArrowUpCircle size={12} />
                      <span>{promotingId === fr.id ? 'Aggiorno...' : 'Promuovi a Prossima'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setCalendarItem({
                            title: `🎵 Prova Green Daze: ${roomObj?.name || ''}`,
                            date: fr.date,
                            timeFrom: fr.from,
                            timeTo: fr.to,
                            location: roomObj?.address || roomObj?.name || '',
                            description: `Prova Green Daze`
                          });
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-card hover:bg-white/10 text-text-secondary hover:text-brand-green border border-brand-border cursor-pointer"
                        title="Esporta calendario"
                      >
                        <Calendar size={13} />
                      </button>

                      <button
                        onClick={() => {
                          const dateStr = format(safeParseLocal(fr.date), 'EEEE d MMMM yyyy', { locale: it });
                          let msg = `🎵 PROVA GREEN DAZE!\n📅 ${dateStr}\n`;
                          if (fr.from) msg += `🕒 ${fr.from} - ${fr.to}\n`;
                          if (roomObj?.name) msg += `📍 ${roomObj.name}\n`;
                          shareInfo(msg, 'wa');
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-card hover:bg-white/10 text-text-secondary hover:text-brand-green border border-brand-border cursor-pointer"
                        title="Condividi su WhatsApp"
                      >
                        <Share2 size={13} />
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onEditFuture(fr);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-card hover:bg-white/10 text-text-secondary hover:text-text-primary border border-brand-border cursor-pointer"
                        title="Modifica sessione"
                      >
                        <Pencil size={13} />
                      </button>

                      {confirmDeleteId === fr.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(fr.id)}
                            disabled={deletingId === fr.id}
                            className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase cursor-pointer"
                          >
                            {deletingId === fr.id ? '...' : 'Sì, Elimina'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-brand-dark text-text-secondary text-[10px] border border-brand-border cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(fr.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                          title="Elimina sessione"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal export calendar */}
        <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />
      </motion.div>
    </div>
  );
};
