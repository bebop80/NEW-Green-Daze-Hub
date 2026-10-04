import React, { useState, useEffect } from 'react';
import { 
  Check, 
  BarChart3, 
  History, 
  Plus, 
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import { AppData, Member } from '../../types';
import { getMemberColor } from '../../lib/utils';
import { AnalyticsModal } from '../modals/AnalyticsModal';
import { HistoryModal } from '../modals/HistoryModal';

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
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden text-white">
      {/* 1. HERO REGISTRA PAGAMENTO: CON SFONDO REALISTICO SOLDI & MUSICA PALCO */}
      <div className="flex-1 min-h-0 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#181d29] to-[#0f1219] shadow-2xl border border-white/[0.06]">
        {/* Foto Sfondo Realistica: Soldi & Musica (Chitarra elettrica vintage, banconote Euro reali, luci palco smeraldo) */}
        <img 
          src="/src/assets/images/gemini_payments_bg.jpg" 
          alt="Soldi e Musica Rock"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none brightness-95 contrast-115"
        />

        {/* Ambient Stage Lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        {/* Overlay cinematografico multi-strato: garantisce contrasto e leggibilità nitida al 100% per tutte le scritte */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1219]/90 via-[#10141f]/78 to-[#0b0e14]/92 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/75 pointer-events-none" />

        {/* Top Header con z-20 */}
        <div className="flex items-center justify-between gap-2 relative z-20 flex-shrink-0 pb-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_#00e660]" />
            <h2 className="text-[11px] font-mono tracking-widest text-brand-green font-bold uppercase drop-shadow-sm">
              REGISTRA PAGAMENTO
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 hover:text-brand-green transition-colors cursor-pointer flex items-center gap-1 py-1 px-2"
          >
            <Plus size={13} className="text-brand-green" />
            <span>Nuovo Membro</span>
          </button>
        </div>

        {/* Body Fields */}
        <div className="flex-1 flex flex-col justify-center py-2 relative z-10 space-y-3.5">
          {/* Box Chi Tocca Pagare */}
          <div className="p-3.5 rounded-2xl bg-[#121620]/80 backdrop-blur-md border border-white/[0.1] shadow-lg flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                Tocca Pagare A
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: systemPayerColor }}
                />
                <span 
                  className="font-rock text-2xl sm:text-3xl uppercase tracking-wider leading-none truncate drop-shadow-md"
                  style={{ color: systemPayerColor }}
                >
                  {systemPayerName || '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Menù a tendina per cambiare chi paga */}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-300 font-bold block mb-1.5 drop-shadow-sm">
              Chi paga
            </label>

            <div className="relative">
              <select
                value={selectedPayer}
                onChange={(e) => setSelectedPayer(e.target.value)}
                style={{ color: activePayerColor }}
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#121620]/85 backdrop-blur-md border border-white/[0.12] text-base font-rock uppercase tracking-wider outline-none focus:border-brand-green appearance-none cursor-pointer shadow-sm"
              >
                <option value="" className="bg-[#121620] text-zinc-400">
                  Seleziona pagatore...
                </option>
                {data?.members.map((m) => (
                  <option 
                    key={m.name} 
                    value={m.name} 
                    className="bg-[#121620] text-white"
                  >
                    {m.name}{systemPayerName === m.name ? ' ★' : ''}
                  </option>
                ))}
                <option value="Spesa condivisa" className="bg-[#121620] text-brand-green">
                  🤝 Spesa condivisa
                </option>
              </select>

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Data Sessione (con icona calendario bianca pura e senza scritte extra) */}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-300 font-bold block mb-1.5 drop-shadow-sm">
              Data Sessione
            </label>

            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full h-11 px-3.5 rounded-xl bg-[#121620]/85 backdrop-blur-md border border-white/[0.12] text-sm font-mono font-bold text-white outline-none focus:border-brand-green date-input-white-icon [color-scheme:dark] shadow-sm cursor-pointer"
            />
          </div>

          {/* Action Button: Conferma Pagamento */}
          <button
            onClick={onRegisterPayment}
            disabled={isSubmitting || !selectedPayer || !paymentDate}
            className={`w-full py-3.5 rounded-2xl font-rock text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isSubmitting || !selectedPayer || !paymentDate
                ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                : 'bg-brand-green hover:bg-brand-green/90 text-black shadow-brand-green/20 active:scale-[0.98]'
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
        className="flex-shrink-0 rounded-2xl p-3.5 bg-gradient-to-r from-[#181d29] to-[#12151e] border border-white/[0.06] hover:border-brand-green/40 shadow-xl flex items-center justify-between gap-2 cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-brand-green shrink-0 group-hover:scale-105 transition-transform">
            <BarChart3 size={18} />
          </div>
          <div className="min-w-0">
            <span className="font-rock text-sm sm:text-base tracking-wider uppercase text-white group-hover:text-brand-green transition-colors block leading-tight">
              STATISTICHE SPESE
            </span>
            <p className="text-[11px] text-zinc-400 truncate">
              {totalPayments} prove
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-rock uppercase tracking-wider text-brand-green group-hover:bg-brand-green group-hover:text-black transition-all shrink-0">
          <span>Grafico</span>
          <ArrowUpRight size={13} />
        </div>
      </div>

      {/* 3. SEGNAPOSTO STORICO PAGAMENTI: CLICK APRE POPUP STORICO + ELIMINA ULTIMO */}
      <div 
        onClick={() => setShowHistoryModal(true)}
        className="flex-shrink-0 rounded-2xl p-3.5 bg-gradient-to-r from-[#181d29] to-[#12151e] border border-white/[0.06] hover:border-brand-green/40 shadow-xl flex items-center justify-between gap-2 cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-brand-green shrink-0 group-hover:scale-105 transition-transform">
            <History size={18} />
          </div>
          <div className="min-w-0">
            <span className="font-rock text-sm sm:text-base tracking-wider uppercase text-white group-hover:text-brand-green transition-colors block leading-tight">
              STORICO PAGAMENTI
            </span>
            <p className="text-[11px] text-zinc-400 truncate">
              {totalPayments} pagamenti registrati
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-rock uppercase tracking-wider text-brand-green group-hover:bg-brand-green group-hover:text-black transition-all shrink-0">
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
