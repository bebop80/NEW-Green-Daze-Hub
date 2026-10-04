import React, { useState } from 'react';
import { MessageSquare, Plus, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppData } from '../types';

interface NotesSectionProps {
  data: AppData | null;
  editingNotes: boolean;
  setEditingNotes: (val: boolean) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ 
  data, 
  editingNotes, 
  setEditingNotes, 
  apiAction 
}) => {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const hasNotes = !!(data?.next?.notes && data.next.notes.trim().length > 0);

  // When there are no notes and not editing and not expanded:
  // Render closed compact section with a "+" button to add notes (matching Prossime Prove design)
  if (!hasNotes && !editingNotes && !isNotesExpanded) {
    return (
      <section className="glass-card overflow-hidden text-text-primary">
        <div className="h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between">
          <div 
            onClick={() => setIsNotesExpanded(true)}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
            <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-1.5 truncate">
              <span>Note della Band</span>
              <span className="text-[12px]">📝</span>
            </h2>
            <ChevronDown size={14} className="text-text-secondary/60 group-hover:text-text-primary transition-colors shrink-0" />
          </div>

          <button 
            onClick={() => {
              setEditingNotes(true);
              setIsNotesExpanded(true);
            }} 
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center bg-brand-green hover:bg-brand-green/90 rounded-xl text-black transition-all shadow-md shadow-brand-green/20 cursor-pointer active:scale-95 shrink-0"
            title="Aggiungi note della band"
            aria-label="Aggiungi note della band"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card overflow-hidden text-text-primary">
      <div className="h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between border-b border-brand-border/60 bg-brand-green/5">
        <div 
          onClick={() => {
            if (!hasNotes && !editingNotes) {
              setIsNotesExpanded(!isNotesExpanded);
            }
          }}
          className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${!hasNotes && !editingNotes ? 'cursor-pointer group' : ''}`}
        >
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
          <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary flex items-center gap-1.5 truncate">
            <span>Note della Band</span>
            <span className="text-[12px]">📝</span>
          </h2>
          {!hasNotes && !editingNotes && (
            <ChevronUp size={14} className="text-text-secondary/60 group-hover:text-text-primary transition-colors shrink-0" />
          )}
        </div>

        {!hasNotes && !editingNotes && (
          <button 
            onClick={() => {
              setEditingNotes(true);
              setIsNotesExpanded(true);
            }} 
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center bg-brand-green hover:bg-brand-green/90 rounded-xl text-black transition-all shadow-md shadow-brand-green/20 cursor-pointer active:scale-95 shrink-0"
            title="Aggiungi note"
            aria-label="Aggiungi note della band"
          >
            <Plus size={16} />
          </button>
        )}

        {hasNotes && !editingNotes && (
          <button 
            onClick={() => setEditingNotes(true)} 
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-text-secondary hover:text-brand-green hover:bg-brand-green/10 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Modifica note"
            aria-label="Modifica note della band"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>
      
      <div className="p-4 sm:p-5">
      {editingNotes ? (
        <div className="space-y-3">
          <textarea 
            className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 font-sans text-xs sm:text-sm focus:border-brand-green outline-none text-text-primary resize-y min-h-[90px]"
            rows={3}
            defaultValue={data?.next?.notes || ''}
            id="notes-textarea"
            placeholder="Scrivi qui note importanti, scaletta o promemoria per la band..."
            autoFocus
          />
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                const val = (document.getElementById('notes-textarea') as HTMLTextAreaElement).value;
                const success = await apiAction('next_rehearsal', { next: { ...data?.next, notes: val } });
                if (success) {
                  setEditingNotes(false);
                  if (!val || val.trim().length === 0) {
                    setIsNotesExpanded(false);
                  }
                }
              }}
              className="flex-1 min-h-[40px] bg-brand-green hover:bg-brand-green/90 py-2 rounded-xl font-bold uppercase text-xs tracking-wider text-black transition-colors cursor-pointer shadow-sm"
            >
              Salva Note
            </button>
            <button 
              onClick={() => {
                setEditingNotes(false);
                if (!hasNotes) setIsNotesExpanded(false);
              }} 
              className="flex-1 min-h-[40px] bg-brand-dark hover:bg-white/5 border border-brand-border py-2 rounded-xl font-bold uppercase text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-dark/80 border border-brand-border rounded-xl p-3.5 sm:p-4 italic relative">
          <div className="absolute top-0 right-0 p-2 opacity-5 italic font-mono text-8xl pointer-events-none">"</div>
          {hasNotes ? (
            <p className="text-text-primary text-xs sm:text-sm leading-relaxed whitespace-pre-wrap relative z-10 font-medium not-italic">
              {data?.next?.notes}
            </p>
          ) : (
            <div className="py-2 text-center space-y-1">
              <p className="text-text-secondary opacity-70 text-[11px] uppercase tracking-widest font-mono">
                Nessuna nota attiva
              </p>
              <p className="text-[10px] text-zinc-500 font-sans not-italic">
                Tocca il tasto + per aggiungere scaletta o promemoria
              </p>
            </div>
          )}
        </div>
      )}
      </div>
    </section>
  );
};
