import React from 'react';
import { Calendar, Music, Clock, MapPin, Send, Settings, TrendingUp, AlertCircle, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Member } from '../types';
import { safeParseLocal } from '../lib/utils';
import { CalendarExportModal, CalendarEventItem } from './modals/CalendarExportModal';

interface NextSessionProps {
  data: AppData | null;
  calcolaTurno: Member | null;
  setEditingNext: (val: boolean) => void;
  shareInfo: (text: string, platform: 'wa' | 'tg') => void;
  formatRehearsalForShare: (r: any) => string;
  onOpenAvailability?: () => void;
}

export const NextSession: React.FC<NextSessionProps> = ({ 
  data, 
  calcolaTurno, 
  setEditingNext, 
  shareInfo,
  formatRehearsalForShare,
  onOpenAvailability
}) => {
  const [calendarItem, setCalendarItem] = React.useState<CalendarEventItem | null>(null);

  const isSharedExpense = !!data?.next?.sharedExpense || 
    (data?.next?.sharedExpense as any) === 'true' || 
    (data?.next?.sharedExpense as any) === 'TRUE' || 
    (!!data?.next?.notes && data.next.notes.includes('[SPESA_CONDIVISA]'));

  return (
    <section className="glass-card p-4 sm:p-6 relative overflow-hidden glow-border">
      {/* Calendar Watermark in background */}
      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
        <Calendar size={52} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_10px_2px_#2d9a56]" />
        <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary">Prossima Sessione</h2>
      </div>

      {data?.next?.date ? (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Main Focus: Big Date & Time */}
          <div className="text-center py-1">
            <div className="text-2xl sm:text-3xl font-display font-black uppercase leading-tight tracking-tight glow-green text-brand-green">
              {format(safeParseLocal(data.next.date), 'EEEE d MMMM', { locale: it })}
            </div>
            {(data.next.from || data.next.to) && (
              <div className="inline-flex items-center justify-center gap-1.5 mt-1.5 px-3 py-0.5 bg-brand-dark/90 border border-brand-border rounded-full font-mono text-xs sm:text-sm font-bold text-text-primary shadow-inner">
                <Clock size={14} className="text-brand-green" />
                <span>{data.next.from} {data.next.to && `— ${data.next.to}`}</span>
              </div>
            )}
          </div>

          {/* Location Card */}
          {(() => {
            const roomObj = data.customRooms.find(r => r.id === data.next.room);
            return (
              <div className="bg-brand-dark/90 border border-brand-border rounded-2xl p-3 sm:p-4 space-y-1 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Music size={14} className="text-brand-green" />
                  <span className="text-[11.5px] uppercase font-black text-brand-green tracking-widest">
                    SALA PROVE
                  </span>
                </div>

                <div className="font-display font-bold text-base sm:text-lg text-text-primary leading-snug break-words text-center">
                  {roomObj?.name || 'Da definire'}
                </div>

                {roomObj?.address && (
                  <div className="text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 text-text-secondary pt-0.5 break-words text-center">
                    <MapPin size={13} className="text-brand-green shrink-0" />
                    <span>{roomObj.address}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Who Pays Card */}
          {(isSharedExpense || calcolaTurno) && (
            <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-3 sm:p-3.5 flex items-center justify-center text-center shadow-sm">
              <div className="flex items-center justify-center gap-2.5 text-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="text-brand-green" />
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase font-black text-text-secondary tracking-widest leading-none text-center">
                    Tocca Pagare A:
                  </div>
                  {isSharedExpense ? (
                    <div className="font-display font-black text-base leading-tight text-brand-green uppercase mt-0.5 text-center">
                      🤝 Spesa condivisa
                    </div>
                  ) : calcolaTurno ? (
                    <div className="font-display font-black text-lg sm:text-xl leading-tight uppercase mt-0.5 text-center" style={{ color: calcolaTurno.color }}>
                      {calcolaTurno.name}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Vertical icon + label layout to prevent text clipping while maintaining height */}
          {(() => {
            const roomObj = data.customRooms.find(r => r.id === data.next.room);
            return (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {roomObj?.address ? (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(roomObj.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[46px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-brand-dark hover:bg-white/5 border border-brand-border hover:border-brand-green/40 text-text-primary rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <MapPin size={15} className="text-brand-green shrink-0" />
                    <span className="text-[11px] font-bold leading-none tracking-tight whitespace-nowrap">Mappa</span>
                  </a>
                ) : (
                  <div className="h-[46px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-brand-dark/40 border border-brand-border/40 text-zinc-500 rounded-xl">
                    <MapPin size={15} className="shrink-0" />
                    <span className="text-[11px] font-bold leading-none tracking-tight whitespace-nowrap">Mappa</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setCalendarItem({
                      title: `🎵 Prova Band${roomObj?.name ? `: ${roomObj.name}` : ''}`,
                      date: data.next.date,
                      timeFrom: data.next.from,
                      timeTo: data.next.to,
                      location: roomObj?.address || roomObj?.name || '',
                      description: `Prova della band in ${roomObj?.name || 'sala prove'}`
                    });
                  }}
                  className="h-[46px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-brand-dark hover:bg-white/5 border border-brand-border hover:border-brand-green/40 text-text-primary rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Calendar size={15} className="text-brand-green shrink-0" />
                  <span className="text-[11px] font-bold leading-none tracking-tight whitespace-nowrap">Calendario</span>
                </button>

                <button 
                  onClick={() => shareInfo(formatRehearsalForShare(data.next), 'wa')}
                  className="h-[46px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-brand-dark hover:bg-white/5 border border-brand-border hover:border-brand-green/40 text-text-primary rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Share2 size={15} className="text-brand-green shrink-0" />
                  <span className="text-[11px] font-bold leading-none tracking-tight whitespace-nowrap">WhatsApp</span>
                </button>
              </div>
            );
          })()}

          {/* Action buttons: Edit schedule and Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button 
              onClick={() => setEditingNext(true)}
              className="w-full min-h-[44px] bg-brand-card hover:bg-white/5 border border-brand-border hover:border-brand-green/50 py-3 px-3 rounded-xl font-bold uppercase text-[11px] tracking-wider transition-all flex items-center justify-center gap-2 group text-text-secondary hover:text-text-primary cursor-pointer shadow-sm"
            >
              <Settings size={15} className="group-hover:rotate-45 transition-transform text-zinc-400 group-hover:text-brand-green" /> 
              <span>Programmazione</span>
            </button>

            {onOpenAvailability && (
              <button 
                onClick={onOpenAvailability}
                className="w-full min-h-[44px] bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 hover:border-brand-green py-3 px-3 rounded-xl font-bold uppercase text-[11px] tracking-wider transition-all flex items-center justify-center gap-2 text-brand-green cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Calendar size={15} className="text-brand-green" /> 
                <span>Disponibilità Band</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 sm:py-5 space-y-3">
          <div className="w-11 h-11 mx-auto rounded-full border-2 border-dashed border-zinc-700/80 flex items-center justify-center text-text-secondary/70">
            <AlertCircle size={22} />
          </div>
          <p className="font-display uppercase text-xs font-bold tracking-[0.15em] text-text-secondary">Nessuna prova in programma</p>
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button 
              onClick={() => setEditingNext(true)}
              className="w-full sm:w-auto min-h-[44px] bg-brand-green hover:bg-brand-green/90 text-black px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-widest cursor-pointer shadow-md shadow-brand-green/10 transition-all hover:scale-[1.02]"
            >
              Imposta Prossima Prova
            </button>
            {onOpenAvailability && (
              <button 
                onClick={onOpenAvailability}
                className="w-full sm:w-auto min-h-[44px] bg-brand-dark hover:bg-white/5 border border-brand-border text-brand-green px-5 py-2 rounded-xl font-bold uppercase text-xs tracking-widest cursor-pointer transition-all hover:border-brand-green"
              >
                Disponibilità Band
              </button>
            )}
          </div>
        </div>
      )}
      <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />
    </section>
  );
};
