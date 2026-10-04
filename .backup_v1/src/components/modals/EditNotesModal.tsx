import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNotes: string;
  onSave: (notes: string) => Promise<boolean>;
}

export const EditNotesModal: React.FC<EditNotesModalProps> = ({
  isOpen,
  onClose,
  currentNotes,
  onSave
}) => {
  const [notes, setNotes] = useState(currentNotes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotes(currentNotes);
    }
  }, [isOpen, currentNotes]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ok = await onSave(notes);
      if (ok) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      const ok = await onSave('');
      if (ok) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm glass-card border border-brand-green/30 bg-brand-card p-4 sm:p-5 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-green" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-text-primary">
              Note della Band
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-dark text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-3">
          <label className="block text-[11px] font-mono uppercase text-text-secondary mb-1.5 font-bold">
            Scaletta, promemoria o accordi
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Scrivi qui le note importanti per le prossime prove..."
            rows={5}
            className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-xs sm:text-sm font-sans focus:border-brand-green outline-none text-text-primary resize-none"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          {currentNotes.trim().length > 0 && (
            <button
              onClick={handleClear}
              disabled={isSaving}
              className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              title="Cancella tutte le note"
            >
              <Trash2 size={14} />
              <span>Elimina</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-brand-green/20 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check size={16} />
            <span>{isSaving ? 'Salvataggio...' : 'Salva Note'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
