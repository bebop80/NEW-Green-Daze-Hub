import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  Plus, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  Users,
  ArrowUpRight
} from 'lucide-react';
import { AppData, Member, FutureRehearsal } from '../../types';
import { safeParseLocal } from '../../lib/utils';
import { CalendarExportModal, CalendarEventItem } from '../modals/CalendarExportModal';
import { FutureSessionsListModal } from '../modals/FutureSessionsListModal';
import { EditNotesModal } from '../modals/EditNotesModal';
import stageBg from '../../assets/images/gemini_stage_bg.jpg';

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
  availableMembers?: Member[];
  hasAllMembersCommonDate?: boolean;
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
  formatRehearsalForShare,
  availableMembers = [],
  hasAllMembersCommonDate = false
}) => {
  const [calendarItem, setCalendarItem] = useState<CalendarEventItem | null>(null);
  const [showFutureListModal, setShowFutureListModal] = useState(false);
  const [showEditNotesModal, setShowEditNotesModal] = useState(false);
  const [customStageBg] = useState<string | null>(() => {
    try {
      return localStorage.getItem('green_daze_custom_stage_bg') || null;
    } catch {
      return null;
    }
  });

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
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden text-white">
      {/* 1. HERO CARD DETTAGLIO PROSSIMA PROVA: TESTI A TUTTA LARGHEZZA, NESSUN TESTO TAGLIATO */}
      <div className="flex-1 min-h-0 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-gradient-to-b dark:from-[#181d29] dark:to-[#0f1219] shadow-xl border border-slate-200 dark:border-white/[0.06] transition-colors">
        {/* Ambient Stage Lighting */}
        <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        {/* Top Header: Completamente scoperto e visibile */}
        <div className="flex items-center justify-between gap-2 relative z-20 flex-shrink-0 pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-brand-green shadow-xs dark:shadow-[0_0_8px_#00e660]" />
            <h2 className="text-[11px] font-mono tracking-widest text-emerald-700 dark:text-brand-green font-bold uppercase">
              DETTAGLIO SESSIONE
            </h2>
          </div>

          <button
            onClick={onOpenNextModal}
            className="text-[11px] font-mono tracking-wider uppercase text-slate-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-brand-green transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Programma</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {hasNext && nextDateObj ? (
          <div className="flex-1 flex flex-col justify-between relative z-10">
            {/* SEZIONE DATA E ORA: PARTE PULITO SOTTO L'HEADER E SCENDE A FILO DELLA LINEA IN BASSO */}
            <div className="relative -mx-4 sm:-mx-5 mt-2 px-4 sm:px-5 py-4 flex-1 flex flex-col justify-center overflow-hidden border-b border-slate-200 dark:border-white/[0.1] shadow-inner">
              {/* Foto dello Sfondo Palco in Bianco, Nero e Grigi per differenziare la scheda Prove dalla Home */}
              <img 
                src={stageBg} 
                alt="Palco Allestito B&W"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none grayscale contrast-125 brightness-95"
              />
              {/* Overlay monocromatico cinematografico bilanciato al centro per massima leggibilità */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/65 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none" />

              {/* Data e Orario in primo piano ALLINEATI AL CENTRO */}
              <div className="relative z-10 space-y-2.5 flex flex-col items-center justify-center text-center">
                <div 
                  className="font-rock text-white tracking-wide uppercase leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,1)] text-shadow text-center"
                  style={{ fontSize: '32px' }}
                >
                  {format(nextDateObj, 'EEEE d MMMM', { locale: it })}
                </div>

                {(data?.next?.from || data?.next?.to) && (
                  <div className="flex justify-center">
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

            {/* SEZIONE SALA PROVE & TURNO CASSA (SFIORE LA PARTE BASSA DELLO SFONDO) */}
            <div className="pt-2.5 space-y-2">
              {/* Sala Prove a tutta larghezza: non viene mai tagliato */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold block">
                  Sala Prove
                </span>
                <div className="font-display font-black text-sm sm:text-base text-slate-900 dark:text-white mt-0.5 leading-snug break-words">
                  {roomObj?.name || 'Da definire'}
                </div>
                {roomObj?.address && (
                  <div className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5 leading-normal break-words">
                    {roomObj.address}
                  </div>
                )}
              </div>

              {/* Turno cassa a tutta larghezza */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] shadow-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                  Tocca Pagare A
                </span>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: isSharedExpense ? '#00e660' : (calcolaTurno?.color || '#00e660') }}
                  />
                  <span 
                    className="font-rock text-xl uppercase tracking-wider leading-none"
                    style={{ color: isSharedExpense ? '#00a844' : (calcolaTurno?.color || '#00a844') }}
                  >
                    {isSharedExpense ? 'Spesa condivisa' : (calcolaTurno?.name || 'Da definire')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2" style={{ paddingTop: '9px' }}>
              {roomObj?.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(roomObj.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-transparent text-xs font-bold text-slate-800 dark:text-white transition-all active:scale-95 shadow-xs"
                >
                  <MapPin size={14} className="text-emerald-600 dark:text-brand-green" />
                  <span>Mappa</span>
                </a>
              ) : (
                <div className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] text-xs text-slate-400 dark:text-zinc-600 border border-slate-200 dark:border-transparent">
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
                className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-transparent text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Calendar size={14} className="text-emerald-600 dark:text-brand-green" />
                <span>Calendario</span>
              </button>

              <button
                onClick={() => shareInfo(formatRehearsalForShare(data.next), 'wa')}
                className="py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-transparent text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Share2 size={14} className="text-emerald-600 dark:text-brand-green" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3 relative z-10">
            <p className="font-mono text-sm uppercase text-slate-600 dark:text-zinc-400">Nessuna prova impostata</p>
            <button
              onClick={onOpenNextModal}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-green dark:text-black font-rock text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-700/20 dark:shadow-brand-green/20 active:scale-95"
            >
              Imposta Prossima Prova
            </button>
          </div>
        )}
      </div>

      {/* 2. NOTE DELLA BAND: SUBITO SOTTO A DETTAGLIO SESSIONE E SOPRA A DISPONIBILITÀ BAND */}
      {rawNotes ? (
        <div className="flex-shrink-0 rounded-2xl p-3 bg-white dark:bg-gradient-to-b dark:from-[#181d29] dark:to-[#0f1219] border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-emerald-600 dark:text-brand-green" />
              <span className="font-rock text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                NOTE DELLA BAND
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowEditNotesModal(true)}
                className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] font-rock text-xs tracking-wider uppercase text-emerald-700 dark:text-brand-green flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              >
                <Pencil size={11} />
                <span>Modifica</span>
              </button>

              <button
                onClick={() => handleSaveNotes('')}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 cursor-pointer active:scale-95 shadow-xs"
                title="Cancella note"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-2.5 flex items-center shadow-xs">
            <p className="text-xs text-slate-800 dark:text-white font-medium italic line-clamp-2">
              "{rawNotes}"
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <button
            onClick={() => setShowEditNotesModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] hover:border-emerald-600/40 dark:hover:border-brand-green/40 text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-brand-green flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-xs"
          >
            <Plus size={14} className="text-emerald-600 dark:text-brand-green" />
            <span>Aggiungi Note Band</span>
          </button>
        </div>
      )}

      {/* 3. CARD DISPONIBILITÀ BAND */}
      <div 
        onClick={onOpenAvailability}
        className="flex-shrink-0 rounded-2xl p-3.5 bg-white dark:bg-gradient-to-r dark:from-[#181d29] dark:to-[#12151e] border border-slate-200 dark:border-white/[0.06] hover:border-emerald-600/40 dark:hover:border-brand-green/40 shadow-sm dark:shadow-xl flex items-center justify-between gap-2 cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-brand-green shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <span className="font-rock text-sm sm:text-base tracking-wider uppercase text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-brand-green transition-colors block leading-tight">
              DISPONIBILITÀ BAND
            </span>
            {availableMembers && availableMembers.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-1 min-w-0 flex-wrap">
                {availableMembers.map((m) => (
                  <span
                    key={m.name}
                    style={{
                      backgroundColor: `${m.color}25`,
                      color: m.color,
                      borderColor: `${m.color}60`
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black border shrink-0 shadow-2xs leading-none"
                    title={`${m.name}: preferenze inserite`}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                ))}

                {hasAllMembersCommonDate && (
                  <span 
                    className="text-base select-none shrink-0 ml-0.5 filter drop-shadow-[0_0_8px_#00e660] dark:drop-shadow-[0_0_12px_#00e660]" 
                    title="Giorno compatibile con tutta la band!"
                  >
                    🤘
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                Nessuna preferenza inserita
              </p>
            )}
          </div>
        </div>

        <div className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-green dark:hover:bg-brand-green/90 dark:text-black font-rock text-xs tracking-wider uppercase flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs shrink-0">
          <span>Apri</span>
          <ArrowUpRight size={13} />
        </div>
      </div>

      {/* 4. CARD PROVE FUTURE: SUBITO SOTTO A DISPONIBILITÀ BAND */}
      <div className="flex-shrink-0 rounded-2xl p-3.5 bg-white dark:bg-gradient-to-r dark:from-[#181d29] dark:to-[#12151e] border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-brand-green shrink-0 shadow-xs">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-rock text-sm sm:text-base tracking-wider uppercase text-slate-900 dark:text-white">
                PROVE FUTURE
              </span>
              <span 
                style={{ backgroundColor: '#3d3d3d' }}
                className="px-2 py-0.2 rounded-full text-emerald-400 dark:text-brand-green text-xs font-mono font-bold border border-white/10 dark:border-brand-green/30"
              >
                {futureCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              {futureCount === 0 
                ? 'Nessuna data in coda' 
                : `${futureCount} ${futureCount === 1 ? 'sessione programmata' : 'sessioni programmate'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenAddFuture}
            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-green dark:hover:bg-brand-green/90 dark:text-black font-rock text-xs tracking-wider uppercase flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
            title="Aggiungi prova futura"
          >
            <Plus size={14} />
            <span>Nuova</span>
          </button>

          {futureCount > 0 && (
            <button
              onClick={() => setShowFutureListModal(true)}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] font-rock text-xs tracking-wider uppercase text-slate-800 dark:text-white cursor-pointer active:scale-95 shadow-xs"
              title="Vedi e gestisci tutte le prove future"
            >
              <span>Gestisci</span>
            </button>
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
