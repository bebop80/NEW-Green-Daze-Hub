import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, MapPin } from 'lucide-react';
import { AppData } from '../../types';

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

  return (
    <AnimatePresence>
      {(showAddRoom || showAddMember) && (
         <div className="fixed inset-0 z-[120] bg-brand-dark/95 backdrop-blur-2xl p-4 flex items-center justify-center">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card w-full max-w-sm p-8 border-brand-green/20 relative">
              {showAddMember && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight text-brand-green border-b border-brand-green/20 pb-4">Membri Band</h3>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 mb-4 scrollbar-hide">
                    {data?.members.map(m => (
                      <div key={m.name} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="font-bold flex items-center gap-3">
                           <div className="w-4 h-4 rounded-full ring-2 ring-white/10" style={{ backgroundColor: m.color }} />
                           {m.name}
                        </span>
                        <button 
                          disabled={deletingId === m.name}
                          onClick={async () => {
                            setDeletingId(m.name);
                            try {
                              await apiAction('delete_member', { name: m.name });
                            } finally {
                              setDeletingId(null);
                            }
                          }} 
                          className="text-red-500 hover:scale-110 p-1.5 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
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
                    ))}
                  </div>
                  <div className="space-y-4 pt-4 border-t border-brand-green/10">
                    <div className="flex gap-3">
                      <input type="text" id="mem-name" className="flex-1 bg-brand-dark border border-brand-border p-3 rounded-xl text-sm font-bold" placeholder="NOME MEMBRO" />
                      <input type="color" id="mem-color" className="w-12 h-12 rounded-xl bg-transparent border-brand-border p-0 overflow-hidden cursor-pointer" defaultValue="#2d9a56" />
                    </div>
                    <button 
                      disabled={isPending}
                      onClick={async () => {
                        if (isPending) return;
                        const nameEl = document.getElementById('mem-name') as HTMLInputElement;
                        const colorEl = document.getElementById('mem-color') as HTMLInputElement;
                        const name = nameEl?.value;
                        const color = colorEl?.value;
                        if (name) {
                          setIsPending(true);
                          try {
                            await apiAction('add_member', { member: { name, color } });
                            if (nameEl) nameEl.value = '';
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
