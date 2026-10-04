import React, { useState } from 'react';
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
  ArrowUpRight
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
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden text-white">
      {/* 1. HERO CARD CONCERTI PROGRAMMATI: STESSO SFONDO E TEMA DELLA HOME */}
      <div className="flex-1 min-h-0 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#181d29] to-[#0f1219] shadow-2xl border border-white/[0.06]">
        {/* Ambient Stage Lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        {/* Header con z-20 per non essere mai coperto */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0 mb-1 relative z-20 pb-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_#00e660]" />
            <h2 className="text-[11px] font-mono tracking-widest text-brand-green font-bold uppercase">
              CONCERTI IN PROGRAMMA
            </h2>
            <span className="px-2 py-0.2 rounded-full bg-brand-green/15 text-brand-green text-xs font-mono font-bold border border-brand-green/30">
              {totalUpcoming}
            </span>
          </div>

          <button
            onClick={onOpenAddConcert}
            className="py-1 px-3 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black font-rock text-xs tracking-wider uppercase flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
          >
            <Plus size={14} />
            <span>Nuovo Live</span>
          </button>
        </div>

        {/* Gig Content */}
        {totalUpcoming > 0 && currentConcert ? (
          <div className="flex-1 flex flex-col justify-between relative z-10">
            {/* Carousel navigation if multiple */}
            {totalUpcoming > 1 && (
              <div className="flex items-center justify-between gap-2 mb-1 z-20 relative">
                <button
                  onClick={handlePrevSlide}
                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white cursor-pointer active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1.5">
                  {upcomingConcerts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeSlide === i ? 'w-5 bg-brand-green' : 'w-1.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextSlide}
                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white cursor-pointer active:scale-95"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Concert Details con foto di sfondo: parte sotto l'header e scende fino alla riga delle azioni */}
            <div className="relative -mx-4 sm:-mx-5 mt-1.5 px-4 sm:px-5 py-4 flex-1 flex flex-col justify-center items-center text-center overflow-hidden border-b border-white/[0.1] shadow-inner">
              {/* Foto dello Sfondo Concerto */}
              <img 
                src="/src/assets/images/gemini_concert_bg.jpg" 
                alt="Live Concert Background"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none brightness-105 contrast-110"
              />
              {/* Overlay cinematografico per massima leggibilità del testo */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/75 pointer-events-none" />
              <div className="absolute inset-0 bg-radial from-transparent via-black/35 to-black/75 pointer-events-none" />

              <div className="relative z-10 space-y-1.5 max-w-full">
                <h3 
                  className="font-rock text-white uppercase tracking-wide leading-tight break-words drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                  style={{ fontSize: '45px' }}
                >
                  {currentConcert.name}
                </h3>

                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold text-brand-green drop-shadow-md">
                  <Calendar size={13} style={{ backgroundColor: '#000000' }} />
                  <span style={{ fontSize: '16px', color: '#ffffff' }}>
                    {format(safeParseLocal(currentConcert.date), 'EEEE d MMMM yyyy', { locale: it })}
                  </span>
                  {currentConcert.time && <span>• Ore {currentConcert.time}</span>}
                </div>

                {currentConcert.address && (
                  <div className="flex items-center justify-center gap-1 text-xs text-zinc-300 mt-0.5 truncate drop-shadow-sm">
                    <MapPin size={12} className="text-brand-green shrink-0" />
                    <span className="truncate" style={{ fontSize: '14px' }}>
                      {currentConcert.address}
                    </span>
                  </div>
                )}

                {/* Extra badges: Soundcheck & Cachet */}
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  {currentConcert.soundcheck && (
                    <span className="px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs border border-white/[0.12] text-xs font-mono text-zinc-200 shadow-xs">
                      Soundcheck: {currentConcert.soundcheck}
                    </span>
                  )}
                  {currentConcert.cachet && (
                    <span className="px-2.5 py-0.5 rounded-md bg-brand-green text-black border border-brand-green/40 text-xs font-mono font-bold shadow-md shadow-brand-green/20">
                      Cachet: {currentConcert.cachet}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Row */}
            <div className="space-y-2 pt-1 border-t border-white/[0.08]">
              <div className="grid grid-cols-3 gap-2">
                {currentConcert.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentConcert.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white active:scale-95 transition-all shadow-xs"
                  >
                    <MapPin size={14} className="text-brand-green" />
                    <span>Mappa</span>
                  </a>
                ) : (
                  <div className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.02] text-xs text-zinc-600">
                    <MapPin size={14} />
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
                  className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  <Calendar size={14} className="text-brand-green" />
                  <span>Calendario</span>
                </button>

                <button
                  onClick={() => {
                    const text = `🔥 CONCERTO GREEN DAZE!\n\n🎸 ${currentConcert.name}\n📅 ${format(safeParseLocal(currentConcert.date), 'EEEE d MMMM yyyy', { locale: it })}\n${currentConcert.time ? `🕒 Ore: ${currentConcert.time}\n` : ''}${currentConcert.address ? `📍 ${currentConcert.address}\n` : ''}`;
                    shareInfo(text, 'wa');
                  }}
                  className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                  <Share2 size={14} className="text-brand-green" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Edit / Delete Row */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  onClick={() => onEditConcert(currentConcert)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] font-rock text-xs tracking-wider uppercase text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Pencil size={13} />
                  <span style={{ fontSize: '14px' }}>Modifica Live</span>
                </button>

                {confirmDeleteId === currentConcert.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(currentConcert.id)}
                      disabled={deletingId === currentConcert.id}
                      className="px-3 py-1.5 rounded-xl bg-red-500 text-white font-rock text-xs uppercase tracking-wider cursor-pointer"
                    >
                      {deletingId === currentConcert.id ? '...' : 'Sì, Elimina'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] text-zinc-300 font-rock text-xs border border-white/[0.08] cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(currentConcert.id)}
                    className="py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-rock text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Trash2 size={13} />
                    <span style={{ fontSize: '14px' }}>Elimina</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-3 relative z-10">
            <Ticket size={36} className="text-brand-green/60" />
            <p className="font-mono text-sm uppercase text-zinc-400">
              Nessun concerto programmato
            </p>
            <button
              onClick={onOpenAddConcert}
              className="px-6 py-2.5 rounded-xl bg-brand-green text-black font-rock text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-brand-green/20"
            >
              + Aggiungi Concerto
            </button>
          </div>
        )}
      </div>

      {/* 2. CARD STORICO CONCERTI: SLICK DARK THEME */}
      <div className="flex-shrink-0 rounded-2xl p-3.5 bg-gradient-to-r from-[#181d29] to-[#12151e] border border-white/[0.06] shadow-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-brand-green shrink-0">
            <Trophy size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-rock text-sm sm:text-base tracking-wider uppercase text-white">
                STORICO CONCERTI
              </span>
              <span className="px-2 py-0.2 rounded-full bg-brand-green/15 text-brand-green text-xs font-mono font-bold border border-brand-green/30">
                {pastConcerts.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {pastConcerts.length === 0 
                ? 'Nessun concerto nell\'archivio' 
                : `Ultimo: ${pastConcerts[0]?.name || ''}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPastModal(true)}
          className="py-1.5 px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] font-rock text-xs tracking-wider uppercase text-brand-green flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
        >
          <span>Archivio</span>
          <ArrowUpRight size={13} />
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
