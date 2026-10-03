import React, { useState, useRef } from 'react';
import { 
  Share2, 
  Trash2, 
  MapPin, 
  Plus, 
  Pencil, 
  Calendar, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Banknote, 
  FileText, 
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Concert } from '../types';
import { cn, safeParseLocal, toLocalYYYYMMDD } from '../lib/utils';
import { CalendarExportModal, CalendarEventItem } from './modals/CalendarExportModal';
import { AnimatePresence, motion } from 'motion/react';

interface ConcertsBlockProps {
  data: AppData | null;
  setShowAddConcert: (val: boolean) => void;
  setConcertForm: (val: any) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
  shareInfo: (text: string, platform: 'wa' | 'tg') => void;
}

export const ConcertsBlock: React.FC<ConcertsBlockProps> = ({ 
  data, 
  setShowAddConcert, 
  setConcertForm, 
  apiAction, 
  shareInfo 
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [calendarItem, setCalendarItem] = useState<CalendarEventItem | null>(null);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const sortedConcerts = [...(data?.concerts || [])].sort(
    (a, b) => safeParseLocal(a.date).getTime() - safeParseLocal(b.date).getTime()
  );

  // Automatically filter only today and future concerts (excluding past dates)
  const upcoming = sortedConcerts.filter(
    c => isFuture(safeParseLocal(c.date)) || isToday(safeParseLocal(c.date))
  );

  const totalUpcoming = upcoming.length;
  const currentConcert: Concert | undefined = upcoming[activeSlide] || upcoming[0];

  const handleNextSlide = () => {
    if (totalUpcoming > 1) {
      setActiveSlide(prev => (prev + 1) % totalUpcoming);
    }
  };

  const handlePrevSlide = () => {
    if (totalUpcoming > 1) {
      setActiveSlide(prev => (prev - 1 + totalUpcoming) % totalUpcoming);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      handleNextSlide();
    } else if (isRightSwipe) {
      handlePrevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiAction('delete_concert', { id });
      setConfirmDeleteId(null);
      if (activeSlide >= totalUpcoming - 1) {
        setActiveSlide(Math.max(0, totalUpcoming - 2));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (c: Concert) => {
    setConcertForm({
      id: c.id,
      date: toLocalYYYYMMDD(c.date),
      name: c.name,
      address: c.address || '',
      time: c.time || '',
      soundcheck: c.soundcheck || '',
      cachet: c.cachet || '',
      notes: c.notes || ''
    });
    setShowAddConcert(true);
  };

  const formatConcertShare = (c: Concert) => {
    const dateObj = safeParseLocal(c.date);
    let msg = `🎤 CONCERTO GREEN DAZE!\n\n📅 ${format(dateObj, 'EEEE d MMMM yyyy', { locale: it })}\n📍 ${c.name}\n`;
    if (c.address) msg += `🗺️ ${c.address}\n`;
    if (c.time) msg += `🕒 Live: ${c.time}\n`;
    if (c.soundcheck) msg += `🎧 Soundcheck: ${c.soundcheck}\n`;
    if (c.notes) msg += `ℹ️ ${c.notes}\n`;
    return msg;
  };

  return (
    <section className="glass-card overflow-hidden text-text-primary">
      {/* Title & Counter Badge Header */}
      <div className="h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between border-b border-brand-border/60 bg-brand-green/5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
          <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary truncate">
            Concerti
          </h2>

          {/* Badge contatore a fianco del titolo: esclude le date passate */}
          <span 
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1 border shrink-0",
              totalUpcoming > 0 
                ? "bg-brand-green/15 text-brand-green border-brand-green/40 shadow-sm"
                : "bg-brand-dark text-text-secondary border-brand-border"
            )}
            title={`${totalUpcoming} concerti in arrivo`}
          >
            {totalUpcoming > 0 && <Flame size={11} className="text-brand-green" />}
            {totalUpcoming} {totalUpcoming === 1 ? 'Live futuro' : 'Live futuri'}
          </span>
        </div>

        {/* Add Concert Button */}
        <button 
          onClick={() => {
            setConcertForm({ id: '', date: '', name: '', address: '', time: '', soundcheck: '', cachet: '', notes: '' });
            setShowAddConcert(true);
          }} 
          className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center bg-brand-green hover:bg-brand-green/90 rounded-xl text-black transition-all shadow-md shadow-brand-green/20 cursor-pointer active:scale-95 shrink-0"
          title="Aggiungi nuovo concerto"
          aria-label="Aggiungi nuovo concerto"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {/* Main Future Concerts Area with Swipe / Carousel Navigation */}
        {totalUpcoming > 0 && currentConcert ? (
        <div 
          className="space-y-3"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Carousel Top Controls if multiple concerts exist */}
          {totalUpcoming > 1 && (
            <div className="flex items-center justify-between px-1 text-xs font-mono text-text-secondary">
              <span className="font-bold flex items-center gap-1.5 text-text-secondary">
                <span>Live {activeSlide + 1} di {totalUpcoming}</span>
                <span className="text-[10px] text-zinc-500">• Scorri per navigare</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevSlide}
                  className="min-h-[34px] min-w-[34px] flex items-center justify-center p-1.5 bg-brand-dark border border-brand-border hover:border-brand-green rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  title="Concerto precedente"
                  aria-label="Concerto precedente"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="min-h-[34px] min-w-[34px] flex items-center justify-center p-1.5 bg-brand-dark border border-brand-border hover:border-brand-green rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  title="Concerto successivo"
                  aria-label="Concerto successivo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Active Concert Card with swipe animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentConcert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 transition-all relative border bg-brand-green/10 border-brand-green shadow-[0_0_25px_-5px_#00e660] ring-1 ring-brand-green/30"
            >
              {/* Header: Date Box + Title & Badges */}
              <div className="flex items-start gap-3.5">
                {(() => {
                  const dateObj = safeParseLocal(currentConcert.date);
                  const dayName = format(dateObj, 'EEE', { locale: it }).toUpperCase();
                  const dayNum = format(dateObj, 'dd');
                  const monthName = format(dateObj, 'MMM', { locale: it }).toUpperCase();

                  return (
                    <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl border border-brand-green/60 bg-brand-green/20 text-brand-green flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[10px] font-mono font-black leading-none">{dayName}</span>
                      <span className="text-xl sm:text-2xl font-display font-black leading-none my-0.5 text-text-primary">{dayNum}</span>
                      <span className="text-[9px] font-mono font-bold leading-none">{monthName}</span>
                    </div>
                  );
                })()}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-green">
                      {format(safeParseLocal(currentConcert.date), 'EEEE d MMMM yyyy', { locale: it })}
                    </span>

                    {activeSlide === 0 && (
                      <span className="px-2.5 py-0.5 bg-brand-green text-black font-mono font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={11} /> Prossimo Live
                      </span>
                    )}
                  </div>

                  <div className="font-display font-black text-lg sm:text-xl text-text-primary break-words leading-tight">
                    {currentConcert.name}
                  </div>
                </div>
              </div>

              {/* Location with Google Maps link */}
              {currentConcert.address && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentConcert.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium flex items-start gap-1.5 text-text-secondary hover:text-brand-green transition-colors pt-0.5 break-words group"
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-brand-green" /> 
                  <span className="group-hover:underline">{currentConcert.address}</span>
                  <ExternalLink size={11} className="mt-0.5 opacity-60 group-hover:opacity-100" />
                </a>
              )}

              {/* Concert Timing and Details Grid (Orari, Soundcheck, Cachet, Note) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {currentConcert.time && (
                  <div className="bg-brand-dark/80 border border-brand-border/70 p-2.5 rounded-xl flex items-center gap-2">
                    <Clock size={15} className="text-brand-green shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-text-secondary block font-bold">Inizio Live</span>
                      <span className="text-xs font-mono font-bold text-text-primary">{currentConcert.time}</span>
                    </div>
                  </div>
                )}

                {currentConcert.soundcheck && (
                  <div className="bg-brand-dark/80 border border-brand-border/70 p-2.5 rounded-xl flex items-center gap-2">
                    <Clock size={15} className="text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-text-secondary block font-bold">Soundcheck</span>
                      <span className="text-xs font-mono font-bold text-text-primary">{currentConcert.soundcheck}</span>
                    </div>
                  </div>
                )}

                {currentConcert.cachet && (
                  <div className="bg-brand-dark/80 border border-brand-border/70 p-2.5 rounded-xl flex items-center gap-2">
                    <Banknote size={15} className="text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-text-secondary block font-bold">Cachet</span>
                      <span className="text-xs font-mono font-bold text-emerald-300">{currentConcert.cachet}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Extra Notes */}
              {currentConcert.notes && (
                <div className="bg-brand-dark/60 border border-brand-border/50 p-2.5 rounded-xl flex items-start gap-2 text-xs text-text-secondary">
                  <FileText size={14} className="text-brand-green mt-0.5 shrink-0" />
                  <span className="italic">{currentConcert.notes}</span>
                </div>
              )}

              {/* Inline Delete Confirmation or Footer Toolbar */}
              <AnimatePresence mode="wait">
                {confirmDeleteId === currentConcert.id ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-red-500/20 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      Eliminare questo concerto?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 min-h-[36px] bg-brand-card hover:bg-white/5 border border-brand-border rounded-lg text-xs font-bold text-text-secondary cursor-pointer"
                      >
                        Annulla
                      </button>
                      <button
                        disabled={deletingId === currentConcert.id}
                        onClick={() => handleDelete(currentConcert.id)}
                        className="px-3 py-1.5 min-h-[36px] bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {deletingId === currentConcert.id ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1.5">
                    {/* Carousel Dots on Left */}
                    {totalUpcoming > 1 ? (
                      <div className="flex items-center gap-1.5">
                        {upcoming.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            onClick={() => setActiveSlide(dotIdx)}
                            className={cn(
                              "h-2 rounded-full transition-all cursor-pointer",
                              dotIdx === activeSlide 
                                ? "w-6 bg-brand-green shadow-sm" 
                                : "w-2 bg-brand-border hover:bg-white/40"
                            )}
                            title={`Vai a concerto ${dotIdx + 1}`}
                            aria-label={`Vai a concerto ${dotIdx + 1}`}
                          />
                        ))}
                      </div>
                    ) : <div />}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCalendarItem({
                          title: `🎤 Concerto Green Daze: ${currentConcert.name}`,
                          date: currentConcert.date,
                          timeFrom: currentConcert.time,
                          location: currentConcert.address || currentConcert.name,
                          description: `Live Green Daze. Soundcheck: ${currentConcert.soundcheck || 'N/D'}. Note: ${currentConcert.notes || 'N/D'}`
                        })}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-brand-green hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        title="Aggiungi al calendario (.ics / Google)"
                        aria-label="Aggiungi al calendario"
                      >
                        <Calendar size={18} />
                      </button>

                      <button 
                        onClick={() => shareInfo(formatConcertShare(currentConcert), 'wa')}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-brand-green hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        title="Condividi su WhatsApp"
                        aria-label="Condividi su WhatsApp"
                      >
                        <Share2 size={18} />
                      </button>

                      <button 
                        onClick={() => openEditModal(currentConcert)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-brand-green hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        title="Modifica concerto"
                        aria-label="Modifica concerto"
                      >
                        <Pencil size={18} />
                      </button>

                      <button 
                        onClick={() => setConfirmDeleteId(currentConcert.id)} 
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        title="Elimina concerto"
                        aria-label="Elimina concerto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-7 px-4 text-text-secondary border border-dashed border-brand-border rounded-2xl space-y-3">
          <p className="text-xs font-mono uppercase tracking-wider">
            Nessun concerto futuro in programma
          </p>
          <button
            onClick={() => {
              setConcertForm({ id: '', date: '', name: '', address: '', time: '', soundcheck: '', cachet: '', notes: '' });
              setShowAddConcert(true);
            }}
            className="min-h-[40px] px-4 py-2 bg-brand-card hover:bg-brand-green hover:text-black border border-brand-border rounded-xl text-xs font-display font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            + Inserisci Nuovo Live
          </button>
        </div>
      )}
      </div>

      {/* Calendar Export Modal */}
      <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />
    </section>
  );
};
