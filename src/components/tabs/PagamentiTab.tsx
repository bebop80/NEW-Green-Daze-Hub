import React, { useState } from 'react';
import { 
  Wallet, 
  Calendar, 
  User, 
  Check, 
  BarChart3, 
  History, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppData, Member } from '../../types';
import { safeParseLocal } from '../../lib/utils';
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
  const recentPayments = (data?.payments || []).slice(-3).reverse();

  // Summary per member
  const memberCounts = (data?.members || []).map(m => ({
    name: m.name,
    color: m.color,
    count: (data?.payments || []).filter(p => p.payer === m.name).length
  }));

  const onRegisterPayment = async () => {
    if (isSubmitting || !selectedPayer || !paymentDate) return;
    setIsSubmitting(true);
    try {
      await handleSendPayment();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
      {/* 1. CARD REGISTRAZIONE PAGAMENTO */}
      <div className="glass-card p-3 sm:p-3.5 flex flex-col justify-between border-brand-border/60 relative overflow-hidden flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-3.5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660]" />
            <h2 className="font-display font-bold uppercase tracking-wider text-[11px] text-text-secondary">
              Registra Pagamento
            </h2>
          </div>

          {/* Turno badge */}
          {calcolaTurno && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-green/10 border border-brand-green/30 text-[10px] font-mono text-brand-green">
              <span>Turno:</span>
              <span className="font-black uppercase">{calcolaTurno.name}</span>
            </div>
          )}
        </div>

        {/* Inputs row */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Date Input */}
            <div>
              <label className="text-[9px] font-mono uppercase text-text-secondary font-bold block mb-1">
                Data Prova
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-9 px-2 rounded-xl bg-brand-dark border border-brand-border text-xs font-mono font-bold text-text-primary outline-none focus:border-brand-green"
                />
              </div>
            </div>

            {/* Payer Select */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] font-mono uppercase text-text-secondary font-bold">
                  Chi Paga
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddMember(true)}
                  className="text-[9px] font-bold text-brand-green hover:underline cursor-pointer"
                  title="Aggiungi membro band"
                >
                  + Membro
                </button>
              </div>

              <select
                value={selectedPayer}
                onChange={(e) => setSelectedPayer(e.target.value)}
                className="w-full h-9 px-2 rounded-xl bg-brand-dark border border-brand-border text-xs font-bold text-text-primary outline-none focus:border-brand-green"
              >
                <option value="">Seleziona...</option>
                {data?.members.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
                <option value="Spesa condivisa">🤝 Spesa condivisa</option>
              </select>
            </div>
          </div>

          {/* Big Action Submit Button */}
          <button
            onClick={onRegisterPayment}
            disabled={isSubmitting || !selectedPayer || !paymentDate}
            className={`w-full py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isSubmitting || !selectedPayer || !paymentDate
                ? 'bg-brand-dark/80 text-zinc-500 border border-brand-border cursor-not-allowed'
                : 'bg-brand-green hover:bg-brand-green/90 text-black shadow-brand-green/20 active:scale-[0.98]'
            }`}
          >
            <Check size={16} />
            <span>{isSubmitting ? 'Registrazione in corso...' : 'Salva Pagamento Prova'}</span>
          </button>
        </div>
      </div>

      {/* 2. CARD STATISTICHE SPESE */}
      <div className="glass-card p-3 border-brand-border/60 flex flex-col justify-between flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <BarChart3 size={14} className="text-brand-green" />
            <h3 className="font-display font-bold uppercase tracking-wider text-[11px] text-text-secondary">
              Statistiche Spese
            </h3>
            <span className="px-1.5 py-0.2 rounded-md bg-brand-dark text-brand-green text-[10px] font-mono font-bold border border-brand-border">
              {totalPayments} prove
            </span>
          </div>

          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase text-brand-green hover:underline cursor-pointer"
          >
            <span>Grafico</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Member Badges Counter */}
        <div className="grid grid-cols-4 gap-1.5 py-1">
          {memberCounts.map(m => (
            <div 
              key={m.name}
              className="bg-brand-dark/80 border border-brand-border/60 rounded-xl p-1.5 text-center flex flex-col justify-center"
            >
              <span className="text-[10px] font-black uppercase truncate" style={{ color: m.color }}>
                {m.name}
              </span>
              <span className="text-xs font-mono font-bold text-text-primary mt-0.5">
                {m.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CARD STORICO PAGAMENTI */}
      <div className="glass-card p-3 border-brand-border/60 flex flex-col justify-between flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <History size={14} className="text-brand-green" />
            <h3 className="font-display font-bold uppercase tracking-wider text-[11px] text-text-secondary">
              Ultimi Pagamenti
            </h3>
          </div>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase text-brand-green hover:underline cursor-pointer"
          >
            <span>Tutto lo Storico ({totalPayments})</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Recent payments list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 py-0.5">
          {recentPayments.length === 0 ? (
            <div className="py-4 text-center text-xs text-text-secondary">
              Nessun pagamento registrato.
            </div>
          ) : (
            recentPayments.map((p, idx) => {
              const memberObj = data?.members.find(m => m.name === p.payer);
              const isShared = p.payer === 'Spesa condivisa';

              return (
                <div
                  key={idx}
                  className="bg-brand-dark/70 border border-brand-border/50 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isShared ? '#00e660' : (memberObj?.color || '#94a3b8') }}
                    />
                    <span 
                      className="font-black uppercase truncate text-[11px]"
                      style={{ color: isShared ? '#00e660' : memberObj?.color }}
                    >
                      {p.payer}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-text-secondary shrink-0">
                    {format(safeParseLocal(p.date), 'dd/MM/yyyy')}
                  </span>
                </div>
              );
            })
          )}
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
