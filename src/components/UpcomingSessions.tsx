import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Calendar, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Share2, 
  ArrowUpCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, FutureRehearsal } from '../types';
import { safeParseLocal } from '../lib/utils';
import { CalendarExportModal, CalendarEventItem } from './modals/CalendarExportModal';

interface UpcomingSessionsProps {
  data: AppData | null;
  setShowAddFuture: (val: boolean) => void;
  setFutureForm: (val: Partial<FutureRehearsal>) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
  shareInfo?: (text: string, platform: 'wa' | 'tg') => void;
}

export const UpcomingSessions: React.FC<UpcomingSessionsProps> = ({ 
  data, 
  setShowAddFuture, 
  setFutureForm,
  apiAction,
  shareInfo
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [calendarItem, setCalendarItem] = useState<CalendarEventItem | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiAction('delete_future_rehearsal', { id });
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // Promote this future session to become the active next session
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

  // Sort future rehearsals chronologically
  const sortedFuture = [...(data?.futureRehearsals || [])].sort((a, b) => {
    return safeParseLocal(a.date).getTime() - safeParseLocal(b.date).getTime();
  });

  const formatRehearsalShare = (fr: FutureRehearsal, roomName?: string, roomAddress?: string) => {
    const dateObj = safeParseLocal(fr.date);
    let msg = `🎵 PROVA GREEN DAZE!\n\n📅 ${format(dateObj, 'EEEE d MMMM yyyy', { locale: it })}\n`;
    if (fr.from || fr.to) msg += `🕒 Orario: ${fr.from}${fr.to ? ` — ${fr.to}` : ''}\n`;
    if (roomName) msg += `📍 Sala: ${roomName}\n`;
    if (roomAddress) msg += `🗺️ Indirizzo: ${roomAddress}\n`;
    if (fr.sharedExpense) msg += `🤝 Spesa condivisa\n`;
    return msg;
  };

  const handleOpenAddRehearsal = () => {
    setFutureForm({ date: '', from: '', to: '', room: '', sharedExpense: false });
    setShowAddFuture(true);
  };

  // If there are no future rehearsals, keep section closed showing only the header and the '+' symbol
  if (sortedFuture.length === 0) {
    return (
      <section className="glass-card overflow-hidden text-text-primary">
        <div className="h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
            <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary truncate">
              Prossime Prove
            </h2>
          </div>

          <button 
            onClick={handleOpenAddRehearsal} 
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center bg-brand-green hover:bg-brand-green/90 rounded-xl text-black transition-all shadow-md shadow-brand-green/20 cursor-pointer active:scale-95 shrink-0"
            title="Aggiungi nuova sessione di prova"
            aria-label="Aggiungi nuova sessione di prova"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card overflow-hidden text-text-primary">
      <div className="h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between border-b border-brand-border/60 bg-brand-green/5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
          <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary truncate">
            Prossime Prove
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-green/15 text-brand-green border border-brand-green/30 shrink-0">
            {sortedFuture.length} {sortedFuture.length === 1 ? 'Pianificata' : 'Pianificate'}
          </span>
        </div>

        <button 
          onClick={handleOpenAddRehearsal} 
          className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center bg-brand-green hover:bg-brand-green/90 rounded-xl text-black transition-all shadow-md shadow-brand-green/20 cursor-pointer active:scale-95 shrink-0"
          title="Pianifica nuova sessione di prova"
          aria-label="Pianifica nuova sessione di prova"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {sortedFuture.map(fr => {
          const roomObj = data?.customRooms.find(r => r.id === fr.room);
          const dateObj = safeParseLocal(fr.date);
          const dayName = format(dateObj, 'EEE', { locale: it }).toUpperCase();
          const dayNum = format(dateObj, 'dd');
          const monthName = format(dateObj, 'MMM', { locale: it }).toUpperCase();

          return (
            <motion.div 
               layout
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={fr.id} 
               className="bg-brand-dark/80 border border-brand-border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 group hover:border-brand-green/40 transition-all shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                {/* Visual Calendar Date Box */}
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-brand-card border border-brand-border flex flex-col items-center justify-center shrink-0 shadow-inner">
                  <span className="text-[10px] font-mono font-black text-brand-green leading-none">{dayName}</span>
                  <span className="text-xl sm:text-2xl font-display font-black text-text-primary leading-none my-0.5">{dayNum}</span>
                  <span className="text-[9px] font-mono font-bold text-text-secondary leading-none">{monthName}</span>
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold uppercase text-brand-green">
                      {format(dateObj, 'EEEE d MMMM', { locale: it })}
                    </span>

                    {(fr.from || fr.to) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-text-primary bg-white/5 border border-brand-border/40 px-2 py-0.5 rounded-md">
                        <Clock size={11} className="text-brand-green" />
                        <span>{fr.from}{fr.to ? ` — ${fr.to}` : ''}</span>
                      </span>
                    )}

                    {fr.sharedExpense && (
                      <span className="text-[10px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/30 px-2 py-0.5 rounded-full uppercase">
                        🤝 Spesa condivisa
                      </span>
                    )}
                  </div>

                  <div className="font-display font-bold text-base sm:text-lg text-text-primary leading-tight break-words pt-0.5">
                    {roomObj?.name || 'Sede da definire'}
                  </div>

                  {roomObj?.address && (
                    <div className="text-xs text-text-secondary flex items-start gap-1.5 pt-0.5 break-words">
                      <MapPin size={13} className="mt-0.5 text-brand-green shrink-0" />
                      <span>{roomObj.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Delete Confirmation or Action Bar */}
              <AnimatePresence mode="wait">
                {confirmDeleteId === fr.id ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-red-500/20 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      Eliminare questa prova?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 min-h-[36px] bg-brand-card hover:bg-white/5 border border-brand-border rounded-lg text-xs font-bold text-text-secondary cursor-pointer"
                      >
                        Annulla
                      </button>
                      <button
                        disabled={deletingId === fr.id}
                        onClick={() => handleDelete(fr.id)}
                        className="px-3 py-1.5 min-h-[36px] bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {deletingId === fr.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5 flex-wrap">
                    {/* Quick Promote to Next Rehearsal Button */}
                    <button
                      disabled={promotingId === fr.id}
                      onClick={() => handlePromoteToNext(fr)}
                      className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 hover:border-brand-green px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Imposta come Prossima Sessione principale"
                    >
                      <ArrowUpCircle size={13} />
                      <span>{promotingId === fr.id ? 'Aggiornamento...' : 'Promuovi a Prossima Prova'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Calendar Export (.ics & Google Calendar) */}
                      <button
                        onClick={() => {
                          setCalendarItem({
                            title: `🎵 Prova Band${roomObj?.name ? `: ${roomObj.name}` : ''}`,
                            date: fr.date,
                            timeFrom: fr.from,
                            timeTo: fr.to,
                            location: roomObj?.address || roomObj?.name || '',
                            description: `Prova della band Green Daze in ${roomObj?.name || 'sala prove'}`
                          });
                        }}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-zinc-400 hover:text-brand-green hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        title="Esporta nel Calendario (Google / .ics)"
                        aria-label="Aggiungi al calendario"
                      >
                        <Calendar size={17} />
                      </button>

                      {/* WhatsApp Share */}
                      {shareInfo && (
                        <button 
                          onClick={() => shareInfo(formatRehearsalShare(fr, roomObj?.name, roomObj?.address), 'wa')}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-zinc-400 hover:text-brand-green hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                          title="Condividi su WhatsApp"
                          aria-label="Condividi su WhatsApp"
                        >
                          <Share2 size={17} />
                        </button>
                      )}

                      {/* Edit Button */}
                      <button 
                        onClick={() => {
                          setFutureForm({
                            id: fr.id,
                            date: fr.date,
                            from: fr.from || '',
                            to: fr.to || '',
                            room: fr.room || '',
                            sharedExpense: !!fr.sharedExpense
                          });
                          setShowAddFuture(true);
                        }}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-zinc-400 hover:text-brand-green hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        title="Modifica sessione"
                        aria-label="Modifica sessione"
                      >
                        <Pencil size={17} />
                      </button>

                      {/* Delete Button */}
                      <button 
                        onClick={() => setConfirmDeleteId(fr.id)} 
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Elimina sessione"
                        aria-label="Elimina sessione"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />
    </section>
  );
};
