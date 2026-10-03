import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, X, Trash2, Check } from 'lucide-react';
import { AppData, FutureRehearsal } from '../../types';

interface FutureSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  futureForm: Partial<FutureRehearsal>;
  setFutureForm: (val: any) => void;
  data: AppData | null;
  setShowAddRoom: (val: boolean) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const FutureSessionModal: React.FC<FutureSessionModalProps> = ({
  isOpen,
  onClose,
  futureForm,
  setFutureForm,
  data,
  setShowAddRoom,
  apiAction
}) => {
  const [isPending, setIsPending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isPending) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleSave = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      let success = false;
      const isShared = !!futureForm.sharedExpense;
      const cleanNotes = (futureForm.notes || '').replace(/\[SPESA_CONDIVISA\]/g, '').trim();
      const finalNotes = isShared ? `${cleanNotes} [SPESA_CONDIVISA]`.trim() : cleanNotes;
      const targetId = futureForm.id || ('fut_' + Date.now());
      const payloadFuture = {
        ...futureForm,
        id: targetId,
        date: futureForm.date || '',
        from: futureForm.from || '',
        to: futureForm.to || '',
        room: futureForm.room || '',
        notes: finalNotes,
        sharedExpense: isShared
      };

      if (futureForm.id) {
        const delSuccess = await apiAction('delete_future_rehearsal', { id: futureForm.id });
        if (delSuccess) {
          success = await apiAction('add_future_rehearsal', { rehearsal: payloadFuture });
        }
      } else {
        success = await apiAction('add_future_rehearsal', { rehearsal: payloadFuture });
      }

      if (success) onClose();
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!futureForm.id || isPending) return;
    setIsPending(true);
    try {
      const success = await apiAction('delete_future_rehearsal', { id: futureForm.id });
      if (success) {
        setShowDeleteConfirm(false);
        onClose();
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md p-2.5 sm:p-4 flex items-center justify-center overflow-y-auto"
      onClick={handleClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.18 }}
        className="glass-card w-full max-w-[460px] sm:max-w-[480px] p-4 sm:p-5 border-brand-green/30 relative text-text-primary shadow-2xl flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Identical to NextSessionModal layout */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Calendar Icon Button */}
            <div className="w-10 h-10 rounded-xl bg-brand-dark border border-brand-border/80 flex items-center justify-center text-brand-green shadow-inner shrink-0">
              <Calendar size={20} className="text-brand-green" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold tracking-widest text-text-secondary uppercase block leading-none">
                PROSSIME PROVE
              </span>
              <h3 className="font-display font-black uppercase text-lg sm:text-xl tracking-tight text-brand-green leading-tight">
                {futureForm.id ? "MODIFICA SESSIONE" : "NUOVA SESSIONE"}
              </h3>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body - Compact, Optimized Spacing */}
        <div className="py-3.5 space-y-3">
          {/* Data Prova */}
          <div>
            <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-brand-green" /> 
              <span>Data Prova</span>
            </label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl pl-3 pr-10 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs custom-picker-input"
                value={futureForm.date || ''} 
                onChange={e => setFutureForm({ ...futureForm, date: e.target.value })} 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-primary flex items-center justify-center">
                <Calendar size={16} className="text-text-primary" />
              </div>
            </div>
          </div>

          {/* Orari: Inizio & Fine in grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-brand-green" />
                <span>Ora Inizio</span>
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl pl-3 pr-10 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs custom-picker-input" 
                  value={futureForm.from || ''} 
                  onChange={e => setFutureForm({ ...futureForm, from: e.target.value })} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-primary flex items-center justify-center">
                  <Clock size={16} className="text-text-primary" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-brand-green" />
                <span>Ora Fine</span>
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl pl-3 pr-10 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs custom-picker-input" 
                  value={futureForm.to || ''} 
                  onChange={e => setFutureForm({ ...futureForm, to: e.target.value })} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-primary flex items-center justify-center">
                  <Clock size={16} className="text-text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Sede / Sala Prove */}
          <div>
            <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-brand-green" /> 
              <span>Sala Prove / Sede</span>
            </label>
            <div className="relative">
              <select 
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl px-3 py-2 pr-9 text-xs sm:text-sm font-bold text-text-primary outline-none transition-colors cursor-pointer appearance-none shadow-xs"
                value={futureForm.room || ''}
                onChange={e => {
                  if (e.target.value === 'NEW_ROOM') setShowAddRoom(true);
                  else setFutureForm({ ...futureForm, room: e.target.value });
                }}
              >
                <option value="" className="bg-brand-card text-text-secondary">Seleziona Sede...</option>
                {data?.customRooms.map(r => (
                  <option key={r.id} value={r.id} className="bg-brand-card text-text-primary font-bold">
                    {r.name}
                  </option>
                ))}
                <option value="NEW_ROOM" className="bg-brand-card text-brand-green font-black">
                  + Inizializza Nuova Sede...
                </option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Spesa Condivisa Toggle */}
          <div className="pt-0.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer bg-brand-dark border border-brand-border hover:border-brand-green/40 rounded-xl px-3 py-2 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">🤝</span>
                <div>
                  <span className="text-xs font-bold text-text-primary block leading-tight">Spesa condivisa</span>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-brand-green rounded cursor-pointer shrink-0"
                checked={!!futureForm.sharedExpense} 
                onChange={e => setFutureForm({ ...futureForm, sharedExpense: e.target.checked })} 
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-brand-border/60 space-y-2">
          {/* Primary Action Button: Salva */}
          <button 
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className={`w-full h-11 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] ${
              isPending 
                ? 'bg-brand-green/40 text-black/60 cursor-not-allowed shadow-none' 
                : 'bg-brand-green hover:bg-brand-green/90 text-black shadow-brand-green/20'
            }`}
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Check size={16} className="text-black" />
                <span>{futureForm.id ? "Salva Modifiche" : "Salva Sessione"}</span>
              </>
            )}
          </button>

          {/* Secondary Buttons Row: Elimina (se in modifica) & Annulla */}
          <div className="flex items-center gap-2">
            {futureForm.id && (
              <button 
                type="button"
                disabled={isPending}
                onClick={() => setShowDeleteConfirm(true)} 
                className="flex-1 h-9 bg-brand-dark/80 hover:bg-red-500/10 border border-brand-border/70 hover:border-red-500/40 text-text-secondary hover:text-red-400 rounded-xl font-mono font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={13} className="shrink-0" />
                <span>Elimina</span>
              </button>
            )}
            <button 
              type="button"
              disabled={isPending} 
              onClick={handleClose} 
              className="flex-1 h-9 bg-brand-dark/80 hover:bg-brand-dark border border-brand-border/70 rounded-xl font-mono font-bold uppercase text-[11px] tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div 
              className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ duration: 0.16 }}
                className="w-full max-w-xs bg-brand-card/95 border border-red-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3.5 text-center relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="mx-auto w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
                  <Trash2 size={22} />
                </div>

                <div className="space-y-1">
                  <h4 className="font-display font-black text-sm uppercase tracking-tight text-white">
                    Eliminare questa prova?
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed px-1">
                    Questa sessione verrà rimossa dall'elenco delle prossime prove pianificate.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-brand-dark/80 hover:bg-brand-dark border border-brand-border/70 text-text-secondary hover:text-text-primary transition-all cursor-pointer active:scale-95"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    Elimina
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
