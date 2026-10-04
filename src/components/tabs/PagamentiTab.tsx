import React, { useState, useEffect } from 'react';
import { 
  Check, 
  BarChart3, 
  History, 
  Plus, 
  ArrowUpRight,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { AppData, Member } from '../../types';
import { getMemberColor } from '../../lib/utils';
import { AnalyticsModal } from '../modals/AnalyticsModal';
import { HistoryModal } from '../modals/HistoryModal';
import paymentsBg from '../../assets/images/gemini_payments_bg.jpg';

interface PagamentiTabProps {
  data: AppData | null;
  calcolaTurno: Member | null;
  paymentDate: string;
  setPaymentDate: (val: string) => void;
  selectedPayer: string;
  setSelectedPayer: (val: string) => void;
  handleSendPayment: () => Promise<void> | void;
  setShowAddMember: (val: boolean) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const PagamentiTab: React.FC<PagamentiTabProps> = ({
  data,
  calcolaTurno,
  paymentDate,
  setPaymentDate,
  selectedPayer,
  setSelectedPayer,
  handleSendPayment,
  setShowAddMember,
  apiAction
}) => {
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPayments = data?.payments?.length || 0;

  // Auto-init to the calculated person if not yet selected
  useEffect(() => {
    if (!selectedPayer && calcolaTurno?.name) {
      setSelectedPayer(calcolaTurno.name);
    }
  }, [calcolaTurno, selectedPayer, setSelectedPayer]);

  const onRegisterPayment = async () => {
    if (isSubmitting || !selectedPayer || !paymentDate) return;
    setIsSubmitting(true);
    try {
      await handleSendPayment();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Turno system payer & color (matching chart exactly)
  const systemPayerName = calcolaTurno?.name || '';
  const systemPayerColor = getMemberColor(systemPayerName, data?.members);

  // Active chosen payer color
  const activePayerColor = getMemberColor(selectedPayer, data?.members);

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden text-slate-900 dark:text-white">
      {/* 1. HERO REGISTRA PAGAMENTO: CON SFONDO REALISTICO SOLDI & MUSICA PALCO */}
      <div className="flex-1 min-h-0 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-gradient-to-b dark:from-[#181d29] dark:to-[#0f1219] shadow-xl border border-slate-200 dark:border-white/[0.06] transition-colors">
        {/* Foto Sfondo Realistica: Soldi & Musica (Chitarra elettrica vintage, banconote Euro reali, luci palco smeraldo) */}
        <img 
          src={paymentsBg} 
          alt="Soldi e Musica Rock"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none brightness-95 contrast-115"
        />

        {/* Ambient Stage Lighting */}
        <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-brand-green/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        {/* Overlay cinematografico multi-strato: in light mode frosted glass, in dark mode scuro rock */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/94 via-slate-100/90 to-white/95 dark:from-[#0f1219]/90 dark:via-[#10141f]/78 dark:to-[#0b0e14]/92 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-200/20 to-slate-300/40 dark:via-black/40 dark:to-black/75 pointer-events-none" />

        {/* Top Header con z-20 */}
        <div className="flex items-center justify-between gap-2 relative z-20 flex-shrink-0 pb-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-brand-green shadow-xs dark:shadow-[0_0_8px_#00e660]" />
            <h2 className="text-[11px] font-mono tracking-widest text-emerald-700 dark:text-brand-green font-bold uppercase drop-shadow-sm">
              REGISTRA PAGAMENTO
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="text-[11px] font-mono tracking-wider uppercase text-slate-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-brand-green transition-colors cursor-pointer flex items-center gap-1 py-1 px-2"
          >
            <Plus size={13} className="text-emerald-600 dark:text-brand-green" />
            <span>Nuovo Membro</span>
          </button>
        </div>

        {/* Body Fields */}
        <div className="flex-1 flex flex-col justify-center py-2 relative z-10 space-y-3.5">
          {/* Box Chi Tocca Pagare */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121620]/80 backdrop-blur-md border border-slate-300 dark:border-white/[0.1] shadow-md flex flex-col items-center justify-center text-center gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold block text-center">
              Tocca Pagare A
            </span>
            <div className="flex items-center justify-center gap-2 mt-0.5 text-center">
              <div 
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: systemPayerColor }}
              />
              <span 
                className="font-rock text-2xl sm:text-3xl uppercase tracking-wider leading-none truncate drop-shadow-sm text-center"
                style={{ color: systemPayerColor }}
              >
                {systemPayerName || '--'}
              </span>
            </div>
          </div>

          {/* Menù a tendina per cambiare chi paga */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-700 dark:text-zinc-300 font-bold block mb-1.5 drop-shadow-xs">
              Chi paga
            </label>

            <div className="relative">
              <select
                value={selectedPayer}
                onChange={(e) => setSelectedPayer(e.target.value)}
                style={{ color: activePayerColor }}
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-white/95 dark:bg-[#121620]/85 backdrop-blur-md border border-slate-300 dark:border-white/[0.12] text-base font-rock uppercase tracking-wider outline-none focus:border-emerald-600 dark:focus:border-brand-green appearance-none cursor-pointer shadow-xs"
              >
                <option value="" className="bg-white dark:bg-[#121620] text-slate-400 dark:text-zinc-400">
                  Seleziona pagatore...
                </option>
                {data?.members.map((m) => (
                  <option 
                    key={m.name} 
                    value={m.name} 
                    className="bg-white dark:bg-[#121620] text-slate-900 dark:text-white"
                  >
                    {m.name}{systemPayerName === m.name ? ' ★' : ''}
                  </option>
                ))}
                <option value="Spesa condivisa" className="bg-white dark:bg-[#121620] text-emerald-600 dark:text-brand-green">
                  🤝 Spesa condivisa
                </option>
              </select>

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-zinc-400">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Data Sessione */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-700 dark:text-zinc-300 font-bold block mb-1.5 drop-shadow-xs">
              Data Sessione
            </label>

            <div className="relative">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-white/95 dark:bg-[#121620]/85 backdrop-blur-md border border-slate-300 dark:border-white/[0.12] text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600 dark:focus:border-brand-green [color-scheme:light] dark:[color-scheme:dark] shadow-xs cursor-pointer custom-picker-input"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 dark:text-brand-green flex items-center justify-center">
                <Calendar size={18} className="text-emerald-600 dark:text-brand-green drop-shadow-xs dark:drop-shadow-[0_0_8px_#00e660]" />
              </div>
            </div>
          </div>

          {/* Action Button: Conferma Pagamento */}
          <button
            onClick={onRegisterPayment}
            disabled={isSubmitting || !selectedPayer || !paymentDate}
            className={`w-full py-3.5 rounded-2xl font-rock text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isSubmitting || !selectedPayer || !paymentDate
                ? 'bg-slate-200 dark:bg-white/[0.04] text-slate-400 dark:text-zinc-500 border border-slate-300 dark:border-white/[0.06] cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-green dark:hover:bg-brand-green/90 dark:text-black shadow-emerald-700/20 dark:shadow-brand-green/20 active:scale-[0.98]'
            }`}
          >
            <Check size={18} />
            <span>{isSubmitting ? 'Registrazione in corso...' : 'Conferma Pagamento'}</span>
          </button>
        </div>
      </div>

      {/* 2. SEGNAPOSTO STATISTICHE SPESE: CLICK APRE POPUP GRAFICO */}
      <div 
        onClick={() => setShowAnalyticsModal(true)}
        className="flex-shrink-0 rounded-2xl p-3.5 bg-white dark:bg-gradient-to-r dark:from-[#181d29] dark:to-[#12151e] border border-slate-200 dark:border-white/[0.06] hover:border-emerald-600/40 dark:hover:border-brand-green/40 shadow-sm dark:shadow-xl flex items-center justify-between gap-2 cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-brand-green shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <BarChart3 size={18} />
          </div>
          <div className="min-w-0">
            <span className="font-rock text-sm sm:text-base tracking-wider uppercase text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-brand-green transition-colors block leading-tight">
              STATISTICHE SPESE
            </span>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              {totalPayments} prove
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-white/[0.05] dark:border-white/[0.08] text-xs font-rock uppercase tracking-wider text-emerald-700 dark:text-brand-green group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-brand-green dark:group-hover:text-black transition-all shrink-0 shadow-xs">
          <span>Grafico</span>
          <ArrowUpRight size={13} />
        </div>
      </div>

      {/* 3. SEGNAPOSTO STORICO PAGAMENTI: CLICK APRE POPUP STORICO + ELIMINA ULTIMO */}
      <div 
        onClick={() => setShowHistoryModal(true)}
        className="flex-shrink-0 rounded-2xl p-3.5 bg-white dark:bg-gradient-to-r dark:from-[#181d29] dark:to-[#12151e] border border-slate-200 dark:border-white/[0.06] hover:border-emerald-600/40 dark:hover:border-brand-green/40 shadow-sm dark:shadow-xl flex items-center justify-between gap-2 cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-brand-green shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <History size={18} />
          </div>
          <div className="min-w-0">
            <span className="font-rock text-sm sm:text-base tracking-wider uppercase text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-brand-green transition-colors block leading-tight">
              STORICO PAGAMENTI
            </span>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              {totalPayments} pagamenti registrati
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-white/[0.05] dark:border-white/[0.08] text-xs font-rock uppercase tracking-wider text-emerald-700 dark:text-brand-green group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-brand-green dark:group-hover:text-black transition-all shrink-0 shadow-xs">
          <span>Archivio</span>
          <ArrowUpRight size={13} />
        </div>
      </div>

      {/* Modals */}
      <AnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        data={data}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        data={data}
        apiAction={apiAction}
      />
    </div>
  );
};
