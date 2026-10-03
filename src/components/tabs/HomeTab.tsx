import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Share2, 
  Sparkles, 
  Music, 
  Flame, 
  ArrowRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Member, Concert } from '../../types';
import { safeParseLocal } from '../../lib/utils';
import { CalendarExportModal, CalendarEventItem } from '../modals/CalendarExportModal';

interface HomeTabProps {
  data: AppData | null;
  calcolaTurno: Member | null;
  onNavigateTab: (tab: 'prove' | 'pagamenti' | 'concerti') => void;
  onOpenNextModal: () => void;
  onOpenConcertModal: () => void;
  shareInfo: (text: string, platform: 'wa' | 'tg') => void;
  formatRehearsalForShare: (r: any) => string;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  data,
  calcolaTurno,
  onNavigateTab,
  onOpenNextModal,
  onOpenConcertModal,
  shareInfo,
  formatRehearsalForShare
}) => {
  const [calendarItem, setCalendarItem] = useState<CalendarEventItem | null>(null);

  // Check next rehearsal details
  const hasNext = !!(data?.next?.date);
  const nextDateObj = hasNext ? safeParseLocal(data!.next.date) : null;
  const roomObj = hasNext ? data?.customRooms.find(r => r.id === data.next.room) : null;
  const isSharedExpense = !!data?.next?.sharedExpense || 
    (data?.next?.sharedExpense as any) === 'true' || 
    (data?.next?.sharedExpense as any) === 'TRUE' || 
    (!!data?.next?.notes && data.next.notes.includes('[SPESA_CONDIVISA]'));

  // Next upcoming concert
  const sortedConcerts = [...(data?.concerts || [])].sort(
    (a, b) => safeParseLocal(a.date).getTime() - safeParseLocal(b.date).getTime()
  );
  const upcomingConcerts = sortedConcerts.filter(
    c => isFuture(safeParseLocal(c.date)) || isToday(safeParseLocal(c.date))
  );
  const nextConcert: Concert | undefined = upcomingConcerts[0];

  // Notes check: only show if notes are present
  const rawNotes = (data?.next?.notes || '').replace(/\[SPESA_CONDIVISA\]/g, '').trim();
  const hasNotes = rawNotes.length > 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden">
      {/* 1. CARD PROSSIMA SESSIONE */}
      <div className="flex-1 min-h-0 glass-card p-3 sm:p-3.5 flex flex-col justify-between border-brand-border/60 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-3.5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660]" />
            <h2 className="font-display font-bold uppercase tracking-wider text-[11px] text-text-secondary">
              Prossima Prova
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('prove')}
            className="flex items-center gap-1 text-[10px] font-bold uppercase text-brand-green hover:underline cursor-pointer"
          >
            <span>Dettagli</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {hasNext && nextDateObj ? (
          <div className="flex-1 flex flex-col justify-center py-1">
            <div className="text-center">
              <div className="font-display font-black text-lg sm:text-xl uppercase text-brand-green glow-green tracking-tight leading-tight">
                {format(nextDateObj, 'EEEE d MMMM', { locale: it })}
              </div>
              {(data?.next?.from || data?.next?.to) && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full bg-brand-dark border border-brand-border text-[11px] font-mono font-bold text-text-primary">
                  <Clock size={12} className="text-brand-green" />
                  <span>{data.next.from} {data.next.to && `— ${data.next.to}`}</span>
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              {/* Sala */}
              <div className="bg-brand-dark/70 border border-brand-border/60 rounded-xl p-2 flex flex-col justify-center">
                <span className="text-[9px] uppercase font-mono text-text-secondary font-bold">Sala</span>
                <span className="text-xs font-bold text-text-primary truncate">
                  {roomObj?.name || 'Da definire'}
                </span>
              </div>

              {/* Chi paga */}
              <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-2 flex flex-col justify-center">
                <span className="text-[9px] uppercase font-mono text-brand-green font-bold">Chi Paga</span>
                <span className="text-xs font-black uppercase truncate text-brand-green">
                  {isSharedExpense ? '🤝 Condivisa' : (calcolaTurno?.name || 'Da definire')}
                </span>
              </div>
            </div>

            {/* Quick actions row */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {roomObj?.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(roomObj.address)}`}
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
                    title: `🎵 Prova Green Daze${roomObj?.name ? `: ${roomObj.name}` : ''}`,
                    date: data.next.date,
                    timeFrom: data.next.from,
                    timeTo: data.next.to,
                    location: roomObj?.address || roomObj?.name || '',
                    description: `Prova Green Daze in ${roomObj?.name || 'sala prove'}`
                  });
                }}
                className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
              >
                <Calendar size={12} className="text-brand-green" />
                <span>Calendario</span>
              </button>

              <button
                onClick={() => shareInfo(formatRehearsalForShare(data.next), 'wa')}
                className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
              >
                <Share2 size={12} className="text-brand-green" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-2 text-center space-y-2">
            <AlertCircle size={22} className="text-text-secondary/60" />
            <p className="text-xs uppercase font-mono text-text-secondary font-bold">Nessuna prova in programma</p>
            <button
              onClick={onOpenNextModal}
              className="px-4 py-1.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-95"
            >
              Imposta Prova
            </button>
          </div>
        )}
      </div>

      {/* 2. CARD PROSSIMO CONCERTO (HIGHLIGHTED VIP EVENT!) */}
      <div className="flex-1 min-h-0 glass-card p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden border-2 border-brand-green shadow-[0_0_24px_rgba(0,230,96,0.22)] bg-gradient-to-br from-brand-card/90 via-brand-dark/95 to-brand-green/15">
        {/* Stage lighting glow accent */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-brand-green/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-brand-green animate-pulse" />
            <span className="px-2 py-0.5 rounded-md bg-brand-green text-black font-display font-black text-[10px] uppercase tracking-wider shadow-xs">
              ⚡ LIVE IN ARRIVO
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('concerti')}
            className="flex items-center gap-1 text-[10px] font-bold uppercase text-brand-green hover:underline cursor-pointer"
          >
            <span>Tutti i Live</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {nextConcert ? (
          <div className="flex-1 flex flex-col justify-center py-1 relative z-10">
            <div className="text-center">
              <h3 className="font-display font-black text-base sm:text-lg text-text-primary uppercase tracking-tight leading-snug break-words">
                {nextConcert.name}
              </h3>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-green mt-0.5">
                <Calendar size={12} />
                <span>
                  {format(safeParseLocal(nextConcert.date), 'EEEE d MMMM yyyy', { locale: it })}
                </span>
                {nextConcert.time && <span>• Ore {nextConcert.time}</span>}
              </div>
            </div>

            {nextConcert.address && (
              <div className="flex items-center justify-center gap-1 text-[11px] text-text-secondary mt-1 text-center truncate">
                <MapPin size={12} className="text-brand-green shrink-0" />
                <span className="truncate">{nextConcert.address}</span>
              </div>
            )}

            {/* Quick Live Actions */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {nextConcert.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextConcert.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark/90 hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary active:scale-95"
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
                    title: `⚡ Concerto Green Daze: ${nextConcert.name}`,
                    date: nextConcert.date,
                    timeFrom: nextConcert.time,
                    location: nextConcert.address || nextConcert.name,
                    description: `Live Green Daze @ ${nextConcert.name}. ${nextConcert.notes || ''}`
                  });
                }}
                className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark/90 hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
              >
                <Calendar size={12} className="text-brand-green" />
                <span>Calendario</span>
              </button>

              <button
                onClick={() => {
                  const text = `🔥 CONCERTO GREEN DAZE!\n\n🎸 ${nextConcert.name}\n📅 ${format(safeParseLocal(nextConcert.date), 'EEEE d MMMM yyyy', { locale: it })}\n${nextConcert.time ? `🕒 Ore: ${nextConcert.time}\n` : ''}${nextConcert.address ? `📍 ${nextConcert.address}\n` : ''}`;
                  shareInfo(text, 'wa');
                }}
                className="py-1 px-1 flex items-center justify-center gap-1 rounded-lg bg-brand-dark/90 hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
              >
                <Share2 size={12} className="text-brand-green" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-2 text-center space-y-2 relative z-10">
            <Sparkles size={22} className="text-brand-green/70" />
            <p className="text-xs uppercase font-mono text-text-secondary font-bold">Nessun live in programma</p>
            <button
              onClick={onOpenConcertModal}
              className="px-4 py-1.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-95"
            >
              + Aggiungi Live
            </button>
          </div>
        )}
      </div>

      {/* 3. CARD NOTE DELLA BAND (SOLO SE CI SONO!) */}
      {hasNotes && (
        <div 
          onClick={() => onNavigateTab('prove')}
          className="flex-shrink-0 glass-card p-2.5 sm:p-3 border-brand-border/60 bg-brand-card/90 cursor-pointer hover:border-brand-green/50 transition-colors"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={13} className="text-brand-green" />
              <span className="text-[10px] font-display font-extrabold uppercase tracking-wider text-brand-green">
                Note della Band
              </span>
            </div>
            <span className="text-[9px] font-mono text-text-secondary">Tocca per gestire</span>
          </div>
          <p className="text-xs text-text-primary/90 font-medium italic line-clamp-2">
            "{rawNotes}"
          </p>
        </div>
      )}

      {/* Modal for Calendar Export */}
      <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />
    </div>
  );
};
