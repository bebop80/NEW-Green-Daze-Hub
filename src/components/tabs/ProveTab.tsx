import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Share2, 
  Settings, 
  Plus, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Member, Rehearsal, FutureRehearsal } from '../../types';
import { safeParseLocal } from '../../lib/utils';
import { CalendarExportModal, CalendarEventItem } from '../modals/CalendarExportModal';
import { FutureSessionsListModal } from '../modals/FutureSessionsListModal';
import { EditNotesModal } from '../modals/EditNotesModal';

interface ProveTabProps {
  data: AppData | null;
  calcolaTurno: Member | null;
  onOpenNextModal: () => void;
  onOpenAddFuture: () => void;
  onEditFuture: (fr: FutureRehearsal) => void;
  onOpenAvailability: () => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
  shareInfo: (text: string, platform: 'wa' | 'tg') => void;
  formatRehearsalForShare: (r: any) => string;
}

export const ProveTab: React.FC<ProveTabProps> = ({
  data,
  calcolaTurno,
  onOpenNextModal,
  onOpenAddFuture,
  onEditFuture,
  onOpenAvailability,
  apiAction,
  shareInfo,
  formatRehearsalForShare
}) => {
  const [calendarItem, setCalendarItem] = useState<CalendarEventItem | null>(null);
  const [showFutureListModal, setShowFutureListModal] = useState(false);
  const [showEditNotesModal, setShowEditNotesModal] = useState(false);

  const hasNext = !!(data?.next?.date);
  const nextDateObj = hasNext ? safeParseLocal(data!.next.date) : null;
  const roomObj = hasNext ? data?.customRooms.find(r => r.id === data.next.room) : null;
  const isSharedExpense = !!data?.next?.sharedExpense || 
    (data?.next?.sharedExpense as any) === 'true' || 
    (data?.next?.sharedExpense as any) === 'TRUE' || 
    (!!data?.next?.notes && data.next.notes.includes('[SPESA_CONDIVISA]'));

  const futureCount = data?.futureRehearsals?.length || 0;
  const rawNotes = (data?.next?.notes || '').replace(/\[SPESA_CONDIVISA\]/g, '').trim();

  const handleSaveNotes = async (newNotes: string) => {
    const isShared = isSharedExpense;
    const finalNotes = isShared 
      ? `${newNotes.trim()} [SPESA_CONDIVISA]`.trim() 
      : newNotes.trim();
    return await apiAction('next_rehearsal', { 
      next: { 
        ...data?.next, 
        notes: finalNotes 
      } 
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
      {/* 1. CARD PROSSIMA PROVA IN DETTAGLIO */}
      <div className="glass-card p-3 sm:p-3.5 flex flex-col justify-between border-brand-border/60 relative overflow-hidden flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-3.5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660]" />
            <h2 className="font-display font-bold uppercase tracking-wider text-[11px] text-text-secondary">
              Dettaglio Prossima Sessione
            </h2>
          </div>

          <button
            onClick={onOpenNextModal}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-brand-card hover:bg-white/5 border border-brand-border text-[10px] font-bold uppercase text-text-secondary hover:text-text-primary transition-all cursor-pointer active:scale-95"
          >
            <Settings size={12} className="text-brand-green" />
            <span>Programma</span>
          </button>
        </div>

        {hasNext && nextDateObj ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-display font-black text-base sm:text-lg uppercase text-brand-green glow-green truncate">
                {format(nextDateObj, 'EEEE d MMMM', { locale: it })}
              </div>
              {(data?.next?.from || data?.next?.to) && (
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-text-primary shrink-0 bg-brand-dark px-2 py-0.5 rounded-md border border-brand-border">
                  <Clock size={11} className="text-brand-green" />
                  <span>{data.next.from} {data.next.to && `— ${data.next.to}`}</span>
                </div>
              )}
            </div>

            {/* Room & Who Pays Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-brand-dark/80 border border-brand-border/60 rounded-xl p-2">
                <span className="text-[9px] uppercase font-mono text-text-secondary font-bold block">Sala Prove</span>
                <span className="font-bold text-text-primary truncate block">
                  {roomObj?.name || 'Da definire'}
                </span>
                {roomObj?.address && (
                  <span className="text-[10px] text-text-secondary truncate block mt-0.5">
                    {roomObj.address}
                  </span>
                )}
              </div>

              <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-2">
                <span className="text-[9px] uppercase font-mono text-brand-green font-bold block">Tocca Pagare A</span>
                <span className="font-black uppercase truncate text-brand-green block mt-0.5">
                  {isSharedExpense ? '🤝 Spesa condivisa' : (calcolaTurno?.name || 'Da definire')}
                </span>
              </div>
            </div>

            {/* 3 Quick Action Icons */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {roomObj?.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(roomObj.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-1 flex items-center justify-center gap-1 rounded-xl bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary active:scale-95"
                >
                  <MapPin size={13} className="text-brand-green" />
                  <span>Mappa</span>
                </a>
              ) : (
                <div className="py-1.5 px-1 flex items-center justify-center gap-1 rounded-xl bg-brand-dark/40 border border-brand-border/30 text-[10px] text-zinc-500">
                  <MapPin size={13} />
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
                className="py-1.5 px-1 flex items-center justify-center gap-1 rounded-xl bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
              >
                <Calendar size={13} className="text-brand-green" />
                <span>Calendario</span>
              </button>

              <button
                onClick={() => shareInfo(formatRehearsalForShare(data.next), 'wa')}
                className="py-1.5 px-1 flex items-center justify-center gap-1 rounded-xl bg-brand-dark hover:bg-white/5 border border-brand-border text-[10px] font-bold text-text-primary cursor-pointer active:scale-95"
              >
                <Share2 size={13} className="text-brand-green" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-3 text-center space-y-1.5">
            <p className="text-xs uppercase font-mono text-text-secondary font-bold">Nessuna prova impostata</p>
            <button
              onClick={onOpenNextModal}
              className="px-4 py-1.5 rounded-xl bg-brand-green text-black text-xs font-black uppercase cursor-pointer"
            >
              Imposta Prossima Prova
            </button>
          </div>
        )}
      </div>

      {/* 2. CARD PROVE FUTURE */}
      <div className="glass-card p-3 border-brand-border/60 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-dark border border-brand-border flex items-center justify-center text-brand-green shrink-0">
            <Calendar size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold uppercase tracking-wider text-[11px] text-text-primary">
                Prove Future
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-brand-dark text-brand-green text-[10px] font-mono font-bold border border-brand-border">
                {futureCount}
              </span>
            </div>
            <p className="text-[10px] text-text-secondary truncate">
              {futureCount === 0 
                ? 'Nessuna data in coda' 
                : `${futureCount} ${futureCount === 1 ? 'sessione programmata' : 'sessioni programmate'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenAddFuture}
            className="py-1.5 px-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer active:scale-95"
            title="Aggiungi prova futura"
          >
            <Plus size={13} />
            <span>Nuova</span>
          </button>

          {futureCount > 0 && (
            <button
              onClick={() => setShowFutureListModal(true)}
              className="py-1.5 px-2.5 rounded-xl bg-brand-card hover:bg-white/5 border border-brand-border text-[11px] font-bold uppercase text-text-primary cursor-pointer active:scale-95"
              title="Vedi e gestisci tutte le prove future"
            >
              <span>Gestisci</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TASTO DISPONIBILITÀ BAND (ROCK BUTTON) */}
      <button
        onClick={onOpenAvailability}
        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-brand-green/20 hover:from-brand-green/30 hover:to-brand-green/30 border border-brand-green/50 text-brand-green font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_16px_rgba(0,230,96,0.18)] active:scale-[0.98] transition-all flex-shrink-0"
      >
        <Users size={18} className="text-brand-green" />
        <span>📅 Disponibilità Band (Sync Live)</span>
        <Sparkles size={16} className="text-brand-green" />
      </button>

      {/* 4. CARD NOTE DELLA BAND */}
      <div className="glass-card p-3 border-brand-border/60 flex flex-col justify-between flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-brand-green" />
            <span className="text-[11px] font-display font-extrabold uppercase tracking-wider text-text-primary">
              Note della Band
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEditNotesModal(true)}
              className="py-1 px-2.5 rounded-lg bg-brand-card hover:bg-white/5 border border-brand-border text-[10px] font-bold uppercase text-brand-green flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Pencil size={11} />
              <span>{rawNotes.length > 0 ? 'Modifica' : '+ Aggiungi'}</span>
            </button>

            {rawNotes.length > 0 && (
              <button
                onClick={() => handleSaveNotes('')}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer active:scale-95"
                title="Cancella note"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-brand-dark/70 border border-brand-border/50 rounded-xl p-2 min-h-[46px] flex items-center">
          {rawNotes.length > 0 ? (
            <p className="text-xs text-text-primary/95 font-medium italic line-clamp-2">
              "{rawNotes}"
            </p>
          ) : (
            <p className="text-[11px] text-text-secondary italic">
              Nessuna nota attiva per la prossima sessione.
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <CalendarExportModal item={calendarItem} onClose={() => setCalendarItem(null)} />

      <FutureSessionsListModal
        isOpen={showFutureListModal}
        onClose={() => setShowFutureListModal(false)}
        data={data}
        onOpenAddFuture={onOpenAddFuture}
        onEditFuture={onEditFuture}
        apiAction={apiAction}
        shareInfo={shareInfo}
      />

      <EditNotesModal
        isOpen={showEditNotesModal}
        onClose={() => setShowEditNotesModal(false)}
        currentNotes={rawNotes}
        onSave={handleSaveNotes}
      />
    </div>
  );
};
