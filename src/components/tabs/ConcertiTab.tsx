import React, { useState, useRef } from 'react';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  Share2, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  Flame, 
  Banknote,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Concert } from '../../types';
import { safeParseLocal } from '../../lib/utils';
import { CalendarExportModal, CalendarEventItem } from '../modals/CalendarExportModal';
import { PastConcertsModal } from '../modals/PastConcertsModal';

interface ConcertiTabProps {
  data: AppData | null;
  onOpenAddConcert: () => void;
  onEditConcert: (concert: Concert) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
  shareInfo: (text: string, platform: 'wa' | 'tg') => void;
}

export const ConcertiTab: React.FC<ConcertiTabProps> = ({
  data,
  onOpenAddConcert,
  onEditConcert,
  apiAction,
  shareInfo
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [calendarItem, setCalendarItem] = useState<CalendarEventItem | null>(null);
  const [showPastModal, setShowPastModal] = useState(false);

  // Filter sorted concerts
  const sortedConcerts = [...(data?.concerts || [])].sort(
    (a, b) => safeParseLocal(a.date).getTime() - safeParseLocal(b.date).getTime()
  );

  const upcomingConcerts = sortedConcerts.filter(
    c => isFuture(safeParseLocal(c.date)) || isToday(safeParseLocal(c.date))
  );

  const pastConcerts = sortedConcerts.filter(
    c => !isFuture(safeParseLocal(c.date)) && !isToday(safeParseLocal(c.date))
  ).reverse();

  const totalUpcoming = upcomingConcerts.length;
  const currentConcert: Concert | undefined = upcomingConcerts[activeSlide] || upcomingConcerts[0];

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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const ok = await apiAction('delete_concert', { id });
      if (ok) {
        setConfirmDeleteId(null);
        if (activeSlide >= totalUpcoming - 1 && activeSlide > 0) {
          setActiveSlide(prev => prev - 1);
        }
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden">
      {/* 1. CARD CONCERTI PROGRAMMATI (PROSSIMI LIVE) */}
      <div className="flex-1 min-h-0 glass-card p-3 sm:p-3.5 flex flex-col justify-between border-brand-border/60 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Flame size={15} className="text-brand-green" />
            <h2 className="font-display font-bold uppercase tracking-wider text-[11px] text-text-secondary">
              Concerti Programmati
            </h2>
            <span className="px-1.5 py-0.2 rounded-md bg-brand-dark text-brand-green text-[10px] font-mono font-bold border border-brand-border">
              {totalUpcoming}
            </span>
          </div>

          <button
            onClick={onOpenAddConcert}
            className="py-1 px-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus size={13} />
            <span>Nuovo Live</span>
          </button>
        </div>

        {/* Gig Content */}
        {totalUpcoming > 0 && currentConcert ? (
          <div className="flex-1 flex flex-col justify-between py-1">
            {/* Carousel navigation if multiple */}
            {totalUpcoming > 1 && (
              <div className="flex items-center justify-between gap-2 mb-1">
                <button
                  onClick={handlePrevSlide}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-dark border border-brand-border text-text-secondary hover:text-text-primary cursor-pointer active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1">
                  {upcomingConcerts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeSlide === i ? 'w-5 bg-brand-green' : 'w-1.5 bg-brand-border'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextSlide}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-dark border border-brand-border text-text-secondary hover:text-text-primary cursor-pointer active:scale-95"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Concert Details */}
            <div className="text-center py-1">
              <h3 className="font-display font-black text-base sm:text-lg text-text-primary uppercase tracking-tight leading-tight break-words">
                {currentConcert.name}
              </h3>

              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-green mt-1">
                <Calendar size={13} />
                <span>
                  {format(safeParseLocal(currentConcert.date), 'EEEE d MMMM yyyy', { locale: it })}
                </span>
                {currentConcert.time && <span>• Ore {currentConcert.time}</span>}
              </div>

              {currentConcert.address && (
                <div className="flex items-center justify-center gap-1 text-[11px] text-text-secondary mt-1 truncate">
                  <MapPin size={12} className="text-brand-green shrink-0" />
                  <span className="truncate">{currentConcert.address}</span>
                </div>
              )}

              {/* Extra badges: Soundcheck, Cachet */}
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                {currentConcert.soundcheck && (
                  <span className="px-2 py-0.5 rounded-md bg-brand-dark border border-brand-border text-[10px] font-mono text-text-secondary">
                    Soundcheck: {currentConcert.soundcheck}
                  </span>
                )}
                {currentConcert.cachet && (
                  <span className="px-2 py-0.5 rounded-md bg-brand-green/10 border border-brand-green/30 text-[10px] font-mono font-bold text-brand-green">
                    Cachet: {currentConcert.cachet}
                  </span>
                )}
              </div>
            </div>

            {/* Actions Row */}
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-3 gap-1.5">
                {currentConcert.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentConcert.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary active:scale-95"
                  >
                    <MapPin size={12} className="text-brand-green" />
                    <span>Mappa</span>
                  </a>
                ) : (
                  <div className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark/40 border border-brand-border/30 text-[10px] text-zinc-500">
                    <MapPin size={12} />
                    <span>Mappa</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setCalendarItem({
                      title: `⚡ Live Green Daze: ${currentConcert.name}`,
                      date: currentConcert.date,
                      timeFrom: currentConcert.time,
                      location: currentConcert.address || currentConcert.name,
                      description: `Live Green Daze @ ${currentConcert.name}. ${currentConcert.notes || ''}`
                    });
                  }}
                  className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
                >
                  <Calendar size={12} className="text-brand-green" />
                  <span>Calendario</span>
                </button>

                <button
                  onClick={() => {
                    const text = `🔥 CONCERTO GREEN DAZE!\n\n🎸 ${currentConcert.name}\n📅 ${format(safeParseLocal(currentConcert.date), 'EEEE d MMMM yyyy', { locale: it })}\n${currentConcert.time ? `🕒 Ore: ${currentConcert.time}\n` : ''}${currentConcert.address ? `📍 ${currentConcert.address}\n` : ''}`;
                    shareInfo(text, 'wa');
                  }}
                  className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
                >
                  <Share2 size={12} className="text-brand-green" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Edit / Delete Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-brand-border/40">
                <button
                  onClick={() => onEditConcert(currentConcert)}
                  className="flex-1 py-1 px-2 rounded-lg bg-brand-card hover:bg-white/5 border border-brand-border text-[10px] font-bold uppercase text-text-secondary hover:text-text-primary flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Pencil size={11} />
                  <span>Modifica Live</span>
                </button>

                {confirmDeleteId === currentConcert.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(currentConcert.id)}
                      disabled={deletingId === currentConcert.id}
                      className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase cursor-pointer"
                    >
                      {deletingId === currentConcert.id ? '...' : 'Sì, Elimina'}
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
                    onClick={() => setConfirmDeleteId(currentConcert.id)}
                    className="py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Trash2 size={11} />
                    <span>Elimina</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-4 text-center space-y-2">
            <Ticket size={28} className="text-text-secondary/50" />
            <p className="text-xs uppercase font-mono text-text-secondary font-bold">
              Nessun concerto programmato
            </p>
            <button
              onClick={onOpenAddConcert}
              className="px-4 py-2 rounded-xl bg-brand-green text-black text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              + Aggiungi Concerto
            </button>
          </div>
        )}
      </div>

      {/* 2. CARD STORICO CONCERTI (LIVE PASSATI) */}
      <div className="glass-card p-3 border-brand-border/60 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-dark border border-brand-border flex items-center justify-center text-brand-green shrink-0">
            <Trophy size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold uppercase tracking-wider text-[11px] text-text-primary">
                Storico Concerti
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-brand-dark text-brand-green text-[10px] font-mono font-bold border border-brand-border">
                {pastConcerts.length}
              </span>
            </div>
            <p className="text-[10px] text-text-secondary truncate">
              {pastConcerts.length === 0 
                ? 'Nessun concerto nell\'archivio' 
                : `Ultimo: ${pastConcerts[0]?.name || ''}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPastModal(true)}
          className="py-1.5 px-3 rounded-xl bg-brand-card hover:bg-white/5 border border-brand-border text-[11px] font-bold uppercase text-brand-green flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
        >
          <span>Archivio</span>
        </button>
      </div>

      {/* Modals */}
      <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />

      <PastConcertsModal
        isOpen={showPastModal}
        onClose={() => setShowPastModal(false)}
        data={data}
        apiAction={apiAction}
      />
    </div>
  );
};
