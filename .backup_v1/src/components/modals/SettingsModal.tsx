import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import { AppData } from '../../types';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  data: AppData | null;
  apiAction: (type: string, payload: any) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings,
  setShowSettings,
  data,
  apiAction
}) => {
  return (
    <AnimatePresence>
      {showSettings && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="glass-card p-6 border-brand-green/30 mb-4 bg-brand-green/5">
            <h3 className="font-display uppercase text-xs font-black mb-4 text-brand-green tracking-widest flex items-center gap-2">
              <Settings size={14}/> Configurazione Band
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Nome Band</label>
                <input 
                  type="text" 
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-white font-semibold focus:border-brand-green outline-none"
                  defaultValue={data?.settings?.NomeBand}
                  id="band-name-input"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Colore Primario</label>
                <input 
                  type="color" 
                  className="w-full h-10 rounded-lg cursor-pointer bg-transparent border-brand-border"
                  defaultValue={data?.settings?.ColoreBand || '#2d9a56'}
                  id="band-color-input"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const name = (document.getElementById('band-name-input') as HTMLInputElement).value;
                    const color = (document.getElementById('band-color-input') as HTMLInputElement).value;
                    apiAction('update_settings', { settings: { NomeBand: name, ColoreBand: color } });
                    setShowSettings(false);
                  }}
                  className="flex-1 bg-brand-green py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest text-black"
                >
                  Salva Modifiche
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-zinc-800 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
