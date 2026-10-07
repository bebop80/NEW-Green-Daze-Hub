import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, MapPin, Palette, Check } from 'lucide-react';
import { AppData } from '../../types';
import { setCustomMemberColor } from '../../lib/memberColors';

interface ModalsProps {
  data: AppData | null;
  showAddRoom: boolean;
  setShowAddRoom: (val: boolean) => void;
  showAddMember: boolean;
  setShowAddMember: (val: boolean) => void;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const Modals: React.FC<ModalsProps> = ({
  data,
  showAddRoom,
  setShowAddRoom,
  showAddMember,
  setShowAddMember,
  apiAction
}) => {
  const [isPending, setIsPending] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [updatingColorMember, setUpdatingColorMember] = React.useState<string | null>(null);
  const [savedColorSuccessMember, setSavedColorSuccessMember] = React.useState<string | null>(null);

  const handleMemberColorChange = async (memberName: string, newColor: string) => {
    if (!memberName || !newColor) return;
    setUpdatingColorMember(memberName);
    try {
      // 1. Immediately update local storage and sync in real time to Firestore
      await setCustomMemberColor(memberName, newColor);

      setSavedColorSuccessMember(memberName);
      setTimeout(() => {
        setSavedColorSuccessMember((curr) => (curr === memberName ? null : curr));
      }, 1500);
    } finally {
      setUpdatingColorMember(null);
    }
  };

  // Safely deduplicate member list for rendering
  const memberList = React.useMemo(() => {
    if (!data?.members) return [];
    const seen = new Set<string>();
    const list: typeof data.members = [];
    for (const m of data.members) {
      const k = m.name?.trim().toLowerCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        list.push(m);
      }
    }
    return list;
  }, [data?.members]);

  return (
    <AnimatePresence>
      {(showAddRoom || showAddMember) && (
         <div className="fixed inset-0 z-[120] bg-brand-dark/95 backdrop-blur-2xl p-4 flex items-center justify-center">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card w-full max-w-sm p-8 border-brand-green/20 relative">
              {showAddMember && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight text-brand-green flex items-center justify-between">
                      <span>Membri Band</span>
                      <Palette size={20} className="text-brand-green/70" />
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Tocca il quadratino colorato per cambiare il colore di qualsiasi membro.
                    </p>
                  </div>

                  <div className="max-h-[190px] overflow-y-auto space-y-2 mb-4 scrollbar-hide pr-0.5">
                    {memberList.map(m => {
                      const isSavingThis = updatingColorMember === m.name;
                      const isSavedThis = savedColorSuccessMember === m.name;

                      return (
                        <div 
                          key={m.name} 
                          className="flex justify-between items-center bg-white/5 hover:bg-white/[0.08] p-2.5 px-3 rounded-xl border border-white/5 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Color Picker interattivo per ogni membro */}
                            <label 
                              className="relative flex items-center justify-center cursor-pointer shrink-0 group/color"
                              title={`Cambia colore a ${m.name}`}
                            >
                              <div 
                                className="w-6 h-6 rounded-lg ring-2 ring-white/20 group-hover/color:ring-white/60 transition-all shadow-sm flex items-center justify-center overflow-hidden" 
                                style={{ backgroundColor: m.color }}
                              >
                                {isSavingThis ? (
                                  <svg className="animate-spin h-3 w-3 text-white drop-shadow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : isSavedThis ? (
                                  <Check size={13} className="text-white drop-shadow stroke-[3]" />
                                ) : null}
                              </div>
                              <input 
                                type="color" 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                value={m.color.startsWith('#') ? m.color : '#00e660'}
                                onChange={(e) => handleMemberColorChange(m.name, e.target.value)}
                              />
                            </label>

                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-sm block truncate text-white">
                                {m.name}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 block uppercase">
                                {m.color}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              disabled={deletingId === m.name || isSavingThis}
                              onClick={async () => {
                                setDeletingId(m.name);
                                try {
                                  await apiAction('delete_member', { name: m.name });
                                } finally {
                                  setDeletingId(null);
                                }
                              }} 
                              className="text-red-500 hover:scale-110 p-1.5 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer"
                              title="Elimina membro"
                            >
                              {deletingId === m.name ? (
                                <svg className="animate-spin h-3.5 w-3.5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <Trash2 size={14}/>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-brand-green/10">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-green/80">
                      + Aggiungi Nuovo Membro
                    </div>
                    <div className="flex gap-3">
                      <input type="text" id="mem-name" className="flex-1 bg-brand-dark border border-brand-border p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-brand-green" placeholder="NOME MEMBRO" />
                      <label 
                        className="w-12 h-12 rounded-xl border border-brand-border hover:border-brand-green p-0 overflow-hidden cursor-pointer relative shrink-0 block"
                        title="Scegli colore per il nuovo membro"
                      >
                        <input 
                          type="color" 
                          id="mem-color" 
                          className="w-full h-full bg-transparent border-0 p-0 cursor-pointer scale-150" 
                          defaultValue="#2d9a56" 
                        />
                      </label>
                    </div>
                    <button 
                      disabled={isPending}
                      onClick={async () => {
                        if (isPending) return;
                        const nameEl = document.getElementById('mem-name') as HTMLInputElement;
                        const colorEl = document.getElementById('mem-color') as HTMLInputElement;
                        const name = nameEl?.value?.trim();
                        const color = colorEl?.value || '#2d9a56';
                        if (name) {
                          // Prevent duplicate entry if member already exists
                          if (data?.members?.some(m => m.name.trim().toLowerCase() === name.toLowerCase())) {
                            await handleMemberColorChange(name, color);
                            if (nameEl) nameEl.value = '';
                            return;
                          }

                          setIsPending(true);
                          try {
                            await setCustomMemberColor(name, color);
                            await apiAction('add_member', { member: { name, color } });
                            if (nameEl) nameEl.value = '';
                          } finally {
                            setIsPending(false);
                          }
                        }
                      }} 
                      className={`w-full text-black py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isPending ? 'bg-white/50 cursor-not-allowed opacity-80' : 'bg-white hover:bg-brand-green'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Aggiunta...
                        </>
                      ) : (
                        "AGGIUNGI MEMBRO"
                      )}
                    </button>
                  </div>
                </div>
              )}
              {showAddRoom && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight text-brand-green border-b border-brand-green/20 pb-4 flex items-center gap-3"><MapPin size={24}/> Gestione Sedi</h3>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 mb-4 scrollbar-hide">
                    {data?.customRooms.map(r => (
                      <div key={r.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl text-xs font-bold border border-white/5">
                        {r.name}
                        <button 
                          disabled={deletingId === r.id}
                          onClick={async () => {
                            setDeletingId(r.id);
                            try {
                              await apiAction('delete_room', { id: r.id });
                            } finally {
                              setDeletingId(null);
                            }
                          }} 
                          className="text-red-500 hover:scale-110 p-1.5 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
                          title="Elimina sede"
                        >
                          {deletingId === r.id ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <Trash2 size={14}/>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4 border-t border-brand-green/10">
                    <input type="text" id="room-name" className="w-full bg-brand-dark border border-brand-border p-3 rounded-xl text-sm font-bold" placeholder="NOME SEDE" />
                    <input type="text" id="room-addr" className="w-full bg-brand-dark border border-brand-border p-3 rounded-xl text-sm font-bold" placeholder="INDIRIZZO (GOOGLE MAPS)" />
                    <button 
                      disabled={isPending}
                      onClick={async () => {
                        if (isPending) return;
                        const nameEl = document.getElementById('room-name') as HTMLInputElement;
                        const addrEl = document.getElementById('room-addr') as HTMLInputElement;
                        const name = nameEl?.value;
                        const add = addrEl?.value;
                        if (name) {
                          setIsPending(true);
                          try {
                            await apiAction('add_room', { room: { id: 'room_'+Date.now(), name, address: add } });
                            if (nameEl) nameEl.value = '';
                            if (addrEl) addrEl.value = '';
                          } finally {
                            setIsPending(false);
                          }
                        }
                      }} 
                      className={`w-full text-black py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all ${
                        isPending ? 'bg-white/50 cursor-not-allowed opacity-80' : 'bg-white'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvataggio...
                        </>
                      ) : (
                        "SALVA SEDE"
                      )}
                    </button>
                  </div>
                </div>
              )}
              <button 
                onClick={() => { setShowAddRoom(false); setShowAddMember(false); }}
                className="w-full mt-6 py-3 rounded-xl text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors"
              >
                CHIUDI
              </button>
            </motion.div>
         </div>
      )}
    </AnimatePresence>
  );
};
