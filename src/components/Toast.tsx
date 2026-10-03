import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToastProps {
  toast: { msg: string; type: 'success' | 'error' } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className={cn(
            "fixed bottom-10 left-1/2 -ml-[140px] w-[280px] z-[200] p-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3",
            toast.type === 'success' ? "bg-brand-green text-black" : "bg-red-500 text-white"
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
