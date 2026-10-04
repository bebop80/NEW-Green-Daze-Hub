import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  Flame, 
  ArrowUpRight,
  Music
} from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Member, Concert } from '../../types';
import { safeParseLocal } from '../../lib/utils';
import { CalendarExportModal, CalendarEventItem } from '../modals/CalendarExportModal';
import stageBg from '../../assets/images/gemini_stage_bg.jpg';
import crowdHandsBg from '../../assets/images/rock_concert_crowd_hands.jpg';

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

  // Next rehearsal calculations
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

  // Notes
  const rawNotes = (data?.next?.notes || '').replace(/\[SPESA_CONDIVISA\]/g, '').trim();

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-hidden text-text-primary">
      {/* 1. HERO PROSSIMA PROVA: SEAMLESS, DARK ROCK SURFACE, ZERO SCRITTE TAGLIATE */}
      <div className="flex-1 min-h-0 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-gradient-to-b dark:from-[#181d29] dark:to-[#0f1219] shadow-xl border border-slate-200 dark:border-white/[0.06] transition-colors">
        {/* Ambient Stage Lighting */}
        <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        {/* Top bar status: Pulito, senza "tra x giorni", completamente visibile */}
        <div className="flex items-center justify-between gap-2 relative z-20 flex-shrink-0 pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-brand-green shadow-xs dark:shadow-[0_0_8px_#00e660]" />
            <span className="text-[11px] font-mono tracking-widest text-emerald-700 dark:text-brand-green font-bold uppercase">
              PROSSIMA PROVA
            </span>
          </div>

          <button
            onClick={onOpenNextModal}
            className="text-[11px] font-mono tracking-wider uppercase text-slate-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-brand-green transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Modifica</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {hasNext && nextDateObj ? (
          <div className="flex-1 flex flex-col justify-between relative z-10">
            {/* SEZIONE DATA E ORA: LO SFONDO PARTE PULITO SOTTO LA TOP BAR E SCENDE FINO A TOCCARE LA LINEA IN BASSO */}
            <div className="relative -mx-4 sm:-mx-5 mt-2 px-4 sm:px-5 py-4 flex-1 flex flex-col justify-center overflow-hidden border-b border-slate-200 dark:border-white/[0.1] shadow-inner">
              {/* Foto dello Sfondo Palco: se caricata usa ESATTAMENTE la tua foto! */}
              <img 
                src={stageBg} 
                alt="Palco Allestito"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none brightness-105 contrast-110"
              />
              {/* Overlay calibrato: scuro a sinistra dietro i testi per massima leggibilità, trasparente al centro per mostrare il palco */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none" />

              {/* Data e Orario perfettamente allineati e leggibili */}
              <div className="relative z-10 space-y-2.5">
                <div 
                  className="font-rock text-white tracking-wide uppercase leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,1)] text-shadow"
                  style={{ fontSize: '32px' }}
                >
                  {format(nextDateObj, 'EEEE d MMMM', { locale: it })}
                </div>

                {(data?.next?.from || data?.next?.to) && (
                  <div className="flex">
                    <div 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white dark:bg-brand-green dark:text-black font-rock tracking-wider uppercase shadow-md shadow-emerald-900/20 dark:shadow-brand-green/40 drop-shadow-md"
                      style={{ fontSize: '18px' }}
                    >
                      <Clock size={16} />
                      <span>{data.next.from} {data.next.to && `— ${data.next.to}`}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SEZIONE LUOGO E TURNO CASSA (SFIORE LA PARTE BASSA DELLO SFONDO) */}
            <div className="pt-2.5 space-y-2">
              {/* Luogo a tutta larghezza: non viene mai tagliato */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold block">
                  Luogo
                </span>
                <div 
                  className="font-display font-black text-slate-900 dark:text-white mt-0.5 leading-snug break-words"
                  style={{ fontSize: '18px', paddingTop: '0px', paddingLeft: '0px' }}
                >
                  {roomObj?.name || 'Sala da definire'}
                </div>
                {roomObj?.address && (
                  <div 
                    className="text-slate-600 dark:text-zinc-400 mt-0.5 leading-normal break-words"
                    style={{ fontSize: '13px', paddingBottom: '3px' }}
                  >
                    {roomObj.address}
                  </div>
                )}
              </div>

              {/* Turno cassa dedicato a tutta larghezza */}
              <div 
                onClick={() => onNavigateTab('pagamenti')}
                style={{ paddingTop: '3px', paddingBottom: '8px' }}
                className="flex items-center justify-between px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] cursor-pointer transition-colors group shadow-xs"
              >
                <div style={{ marginLeft: '0px', paddingLeft: '0px', paddingRight: '50px' }}>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                    Turno Cassa Prova
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: isSharedExpense ? '#00e660' : (calcolaTurno?.color || '#00e660') }}
                  />
                  <span 
                    className="font-rock text-xl uppercase tracking-wider leading-none group-hover:underline"
                    style={{ color: isSharedExpense ? '#00a844' : (calcolaTurno?.color || '#00a844') }}
                  >
                    {isSharedExpense ? 'Spesa condivisa' : (calcolaTurno?.name || '--')}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION DOCK: PULSANTI SCURI MODERNI */}
            <div className="grid grid-cols-3 gap-2" style={{ paddingTop: '9px' }}>
              {roomObj?.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(roomObj.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-transparent text-xs font-bold text-slate-800 dark:text-white transition-all active:scale-95 shadow-xs"
                >
                  <MapPin size={14} className="text-emerald-600 dark:text-brand-green" />
                  <span>Mappa</span>
                </a>
              ) : (
                <div className="py-2 px-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] text-xs text-slate-400 dark:text-zinc-600 border border-slate-200 dark:border-transparent">
                  <MapPin size={14} />
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
                className="py-2 px-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-transparent text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Calendar size={14} className="text-emerald-600 dark:text-brand-green" />
                <span>Calendario</span>
              </button>

              <button
                onClick={() => shareInfo(formatRehearsalForShare(data.next), 'wa')}
                className="py-2 px-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-transparent text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Share2 size={14} className="text-emerald-600 dark:text-brand-green" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-3 relative z-10">
            <Music size={36} className="text-emerald-600 dark:text-brand-green/60" />
            <p className="text-sm font-mono uppercase tracking-wider text-slate-600 dark:text-text-secondary">Nessuna prova in programma</p>
            <button
              onClick={onOpenNextModal}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-green dark:text-black font-rock text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-700/20 dark:shadow-brand-green/20 active:scale-95 transition-transform"
            >
              Fissa Prossima Prova
            </button>
          </div>
        )}
      </div>

      {/* 2. PROSSIMO LIVE: FOTO REALISTICA CONCERTO E FOLLA DI SPALLE */}
      <div 
        onClick={() => onNavigateTab('concerti')}
        className="flex-shrink-0 rounded-2xl p-3.5 sm:p-4 border border-emerald-600 dark:border-[#16ff16] shadow-md dark:shadow-[0_0_20px_rgba(0,230,96,0.18)] hover:border-emerald-700 dark:hover:border-brand-green/90 transition-all cursor-pointer group relative overflow-hidden"
      >
        {/* Foto Realistica: Folla al concerto vista di spalle verso il palco illuminato */}
        <img 
          src={crowdHandsBg} 
          alt="Concerto Live e Folla"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-50 group-hover:opacity-65 transition-opacity duration-300 brightness-95"
        />
        {/* Tonalità rock verde e filtri scuri per leggibilità perfetta */}
        <div className="absolute inset-0 bg-[#00ff66]/10 mix-blend-color pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c131a]/95 via-[#0c131a]/85 to-[#080d12]/75 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/55 pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="min-w-0 flex-1">
            {/* Tag Prossimo Live con lieve luce neon verde */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-md bg-emerald-600/25 border border-emerald-400/40 text-emerald-300 dark:text-brand-green font-mono text-[10px] font-bold tracking-widest uppercase shadow-sm">
              <Flame size={12} className="text-emerald-400 dark:text-brand-green" />
              <span>PROSSIMO LIVE</span>
            </div>

            {nextConcert ? (
              <div>
                <h3 className="font-rock text-2xl sm:text-3xl text-white uppercase tracking-wide truncate group-hover:text-emerald-300 dark:group-hover:text-brand-green transition-colors leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {nextConcert.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-200 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  <span className="text-emerald-400 dark:text-brand-green font-bold">
                    {format(safeParseLocal(nextConcert.date), 'EEEE d MMMM', { locale: it })}
                  </span>
                  {nextConcert.time && <span>• Ore {nextConcert.time}</span>}
                </div>
              </div>
            ) : (
              <span className="text-xs text-zinc-300 font-mono block mt-0.5">Nessun concerto in programma</span>
            )}
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.2] text-[11px] font-mono uppercase tracking-wider text-zinc-100 group-hover:text-emerald-400 dark:group-hover:text-brand-green group-hover:border-emerald-400/50 transition-all shrink-0">
            <span>Tutti</span>
            <ArrowUpRight size={13} />
          </div>
        </div>
      </div>

      {/* 3. NOTE DELLA BAND: LINEA PULITA CON ACCENTO VERDE (SE ATTIVE) */}
      {rawNotes && (
        <div 
          onClick={() => onNavigateTab('prove')}
          className="flex-shrink-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.03] border-l-4 border-emerald-600 dark:border-brand-green border-y border-r border-slate-200 dark:border-y-0 dark:border-r-0 shadow-xs dark:shadow-none cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase mb-0.5">
            <span className="text-emerald-700 dark:text-brand-green font-bold">Note Band</span>
            <span>Tocca per gestire</span>
          </div>
          <p className="text-xs text-slate-800 dark:text-white italic line-clamp-1">
            "{rawNotes}"
          </p>
        </div>
      )}

      {/* Modal for Calendar Export */}
      <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />
    </div>
  );
};
