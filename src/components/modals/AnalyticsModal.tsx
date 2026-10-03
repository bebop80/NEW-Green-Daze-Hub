import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { BarChart3, X } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData } from '../../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData | null;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const totalPayments = data?.payments.length || 0;
  const chartData = data?.members.map(m => ({
    name: m.name,
    count: (data?.payments || []).filter(p => p.payer === m.name).length,
    color: m.color
  })) || [];

  const sharedCount = (data?.payments || []).filter(p => p.payer === 'Spesa condivisa').length;
  if (sharedCount > 0) {
    chartData.push({
      name: 'Condivisa',
      count: sharedCount,
      color: '#00e660'
    });
  }

  const maxCount = Math.max(...chartData.map(d => d.count), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md max-h-[85vh] glass-card border border-brand-green/30 bg-brand-card p-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-green" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-text-primary">
              Statistiche Spese Prove
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-dark text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-4 overflow-y-auto">
          {/* Summary KPI */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-brand-dark/90 border border-brand-border rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-text-secondary font-bold block">
                Totale Pagamenti
              </span>
              <span className="font-display font-black text-2xl text-brand-green">
                {totalPayments}
              </span>
            </div>
            <div className="bg-brand-dark/90 border border-brand-border rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-text-secondary font-bold block">
                Membri Attivi
              </span>
              <span className="font-display font-black text-2xl text-text-primary">
                {data?.members.length || 0}
              </span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-brand-dark/60 border border-brand-border/70 rounded-xl p-3">
            <span className="text-[11px] font-mono uppercase text-text-secondary font-bold block mb-2">
              Distribuzione Prove Pagate
            </span>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    type="number" 
                    domain={[0, Math.max(maxCount + 1, 4)]} 
                    stroke="currentColor" 
                    className="text-text-secondary font-mono text-[10px]" 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="currentColor" 
                    className="text-text-primary font-bold text-xs" 
                    width={80} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#121620', 
                      borderColor: '#4a5872', 
                      borderRadius: '8px', 
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#00e660'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-brand-dark border border-brand-border text-xs font-bold uppercase text-text-primary hover:bg-white/5 cursor-pointer mt-1"
        >
          Chiudi
        </button>
      </motion.div>
    </div>
  );
};
