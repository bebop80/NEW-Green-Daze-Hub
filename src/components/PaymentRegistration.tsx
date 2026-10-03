import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronUp, ChevronDown, Calendar, User, Check } from 'lucide-react';
import { AppData } from '../types';
import { cn } from '../lib/utils';

interface PaymentRegistrationProps {
  data: AppData | null;
  isPaymentExpanded: boolean;
  setIsPaymentExpanded: (val: boolean) => void;
  paymentDate: string;
  setPaymentDate: (val: string) => void;
  selectedPayer: string;
  setSelectedPayer: (val: string) => void;
  handleSendPayment: () => Promise<void> | void;
  setShowAddMember: (val: boolean) => void;
}

export const PaymentRegistration: React.FC<PaymentRegistrationProps> = ({
  data,
  isPaymentExpanded,
  setIsPaymentExpanded,
  paymentDate,
  setPaymentDate,
  selectedPayer,
  setSelectedPayer,
  handleSendPayment,
  setShowAddMember
}) => {
  const [isPending, setIsPending] = useState(false);

  const onAuthorize = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await handleSendPayment();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section 
      className={cn(
        "glass-card transition-all duration-200 overflow-hidden",
        isPaymentExpanded ? "border-brand-green/30 shadow-xl" : "border-brand-green/10"
      )}
    >
      {/* Header bar matching the modal header style */}
      <div 
        className={cn(
          "h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between cursor-pointer group transition-colors select-none",
          isPaymentExpanded ? "bg-brand-green/5 border-b border-brand-border/60" : "hover:bg-white/[0.02]"
        )}
        onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
          <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
            Registra Pagamento
          </h2>
        </div>

        <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
          {isPaymentExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      
      <AnimatePresence>
        {isPaymentExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Form body matching NextSessionModal */}
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Data Transazione */}
              <div>
                <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-brand-green" /> 
                  <span>Data Transazione</span>
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl pl-3 pr-10 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs custom-picker-input"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-primary flex items-center justify-center">
                    <Calendar size={16} className="text-text-primary" />
                  </div>
                </div>
              </div>

              {/* Membro Pagante */}
              <div>
                <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-brand-green" /> 
                  <span>Membro Pagante</span>
                </label>
                <div className="relative">
                  <select 
                    className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl px-3 py-2 pr-9 text-xs sm:text-sm font-bold text-text-primary outline-none transition-colors cursor-pointer appearance-none shadow-xs"
                    value={selectedPayer}
                    onChange={e => {
                      if (e.target.value === 'ADD_MEMBER') setShowAddMember(true);
                      else setSelectedPayer(e.target.value);
                    }}
                  >
                    <option value="" className="bg-brand-card text-text-secondary">Seleziona Membro...</option>
                    {data?.members.map(m => (
                      <option key={m.name} value={m.name} className="bg-brand-card text-text-primary font-bold">
                        {m.name}
                      </option>
                    ))}
                    <option value="Spesa condivisa" className="bg-brand-card text-brand-green font-bold">
                      🤝 Spesa condivisa
                    </option>
                    <option value="ADD_MEMBER" className="bg-brand-card text-brand-green font-black">
                      + Aggiungi / Modifica Membri...
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-brand-border/60 space-y-2">
                <button 
                  type="button"
                  disabled={isPending}
                  onClick={onAuthorize}
                  className={cn(
                    "w-full h-11 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]",
                    isPending 
                      ? "bg-brand-green/40 text-black/60 cursor-not-allowed shadow-none" 
                      : "bg-brand-green hover:bg-brand-green/90 text-black shadow-brand-green/20"
                  )}
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Registrazione in corso...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} className="text-black" />
                      <span>Registra Pagamento</span>
                    </>
                  )}
                </button>

                <button 
                  type="button"
                  disabled={isPending} 
                  onClick={() => setIsPaymentExpanded(false)} 
                  className="w-full h-9 bg-brand-dark/80 hover:bg-brand-dark border border-brand-border/70 rounded-xl font-mono font-bold uppercase text-[11px] tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annulla
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
