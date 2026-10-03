import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Calendar, Clock, MapPin, Banknote, FileText, X, Trash2, Check } from 'lucide-react';
import { Concert } from '../../types';

interface ConcertModalProps {
  isOpen: boolean;
  onClose: () => void;
  concertForm: Partial<Concert>;
  setConcertForm: (val: any) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const ConcertModal: React.FC<ConcertModalProps> = ({
  isOpen,
  onClose,
  concertForm,
  setConcertForm,
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
      const targetId = concertForm.id || ('conc_' + Date.now());
      const concertPayload = {
        id: targetId,
        date: concertForm.date || '',
        name: concertForm.name || '',
        address: concertForm.address || '',
        time: concertForm.time || '',
        soundcheck: concertForm.soundcheck || '',
        cachet: concertForm.cachet || '',
        notes: concertForm.notes || ''
      };

      if (concertForm.id) {
        // Delete existing and re-add updated
        const deleteSuccess = await apiAction('delete_concert', { id: concertForm.id });
        if (deleteSuccess) {
          success = await apiAction('add_concert', { concert: concertPayload });
        }
      } else {
        success = await apiAction('add_concert', { concert: concertPayload });
      }

      if (success) {
        onClose();
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!concertForm.id || isPending) return;
    setIsPending(true);
    try {
      const success = await apiAction('delete_concert', { id: concertForm.id });
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
        {/* Header - Matching FutureSessionModal & NextSessionModal */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Music Icon Button */}
            <div className="w-10 h-10 rounded-xl bg-brand-dark border border-brand-border/80 flex items-center justify-center text-brand-green shadow-inner shrink-0">
              <Music size={20} className="text-brand-green" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold tracking-widest text-text-secondary uppercase block leading-none">
                CALENDARIO LIVE
              </span>
              <h3 className="font-display font-black uppercase text-lg sm:text-xl tracking-tight text-brand-green leading-tight">
                {concertForm.id ? "MODIFICA CONCERTO" : "NUOVO CONCERTO"}
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
          {/* Data Concerto */}
          <div>
            <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-brand-green" /> 
              <span>Data Concerto</span>
            </label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl pl-3 pr-10 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs custom-picker-input"
                value={concertForm.date || ''} 
                onChange={e => setConcertForm({ ...concertForm, date: e.target.value })} 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-primary flex items-center justify-center">
                <Calendar size={16} className="text-text-primary" />
              </div>
            </div>
          </div>

          {/* Nome Locale / Festival */}
          <div>
            <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
              <Music size={13} className="text-brand-green" />
              <span>Nome Locale / Festival</span>
            </label>
            <input 
              type="text" 
              className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl px-3 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs placeholder:text-zinc-600" 
              placeholder="Es. Alcatraz, Legend Club, Bloom..." 
              value={concertForm.name || ''} 
              onChange={e => setConcertForm({ ...concertForm, name: e.target.value })} 
            />
          </div>

          {/* Indirizzo / Città */}
          <div>
            <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-brand-green" />
              <span>Indirizzo / Città</span>
            </label>
            <input 
              type="text" 
              className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl px-3 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs placeholder:text-zinc-600" 
              placeholder="Via, Civico, Città per Google Maps" 
              value={concertForm.address || ''} 
              onChange={e => setConcertForm({ ...concertForm, address: e.target.value })} 
            />
          </div>

          {/* Orari: Inizio Live & Soundcheck in grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-brand-green" />
                <span>Inizio Live</span>
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl pl-3 pr-10 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs custom-picker-input" 
                  value={concertForm.time || ''} 
                  onChange={e => setConcertForm({ ...concertForm, time: e.target.value })} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-primary flex items-center justify-center">
                  <Clock size={16} className="text-text-primary" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-brand-green" />
                <span>Soundcheck</span>
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl pl-3 pr-10 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs custom-picker-input" 
                  value={concertForm.soundcheck || ''} 
                  onChange={e => setConcertForm({ ...concertForm, soundcheck: e.target.value })} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-primary flex items-center justify-center">
                  <Clock size={16} className="text-text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Cachet & Note / Rider in grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                <Banknote size={13} className="text-brand-green" />
                <span>Cachet (€)</span>
              </label>
              <input 
                type="text" 
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl px-3 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs placeholder:text-zinc-600" 
                placeholder="Es. 400€" 
                value={concertForm.cachet || ''} 
                onChange={e => setConcertForm({ ...concertForm, cachet: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-1.5 flex items-center gap-1.5">
                <FileText size={13} className="text-brand-green" />
                <span>Note / Rider</span>
              </label>
              <input 
                type="text" 
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-green rounded-xl px-3 py-2 text-sm font-bold text-text-primary outline-none transition-colors shadow-xs placeholder:text-zinc-600" 
                placeholder="Es. Aste microfono..." 
                value={concertForm.notes || ''} 
                onChange={e => setConcertForm({ ...concertForm, notes: e.target.value })} 
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-brand-border/60 flex flex-col gap-2">
          {/* Primary Save Button */}
          <button 
            type="button"
            disabled={isPending || !concertForm.date || !concertForm.name}
            onClick={handleSave} 
            className="w-full h-11 bg-brand-green hover:bg-brand-green/90 text-black rounded-xl font-display font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-md shadow-brand-green/20 cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Check size={16} className="text-black" />
                <span>{concertForm.id ? "SALVA MODIFICHE" : "AGGIUNGI CONCERTO"}</span>
              </>
            )}
          </button>

          {/* Secondary Action Row: Elimina (if editing) & Annulla */}
          <div className="flex items-center gap-2">
            {concertForm.id && (
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

        {/* Delete Confirmation Modal Overlay */}
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
                    Eliminare questo concerto?
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed px-1">
                    Il concerto verrà rimosso definitivamente dal calendario live.
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
