import React, { useState } from 'react';
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
import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppData } from '../types';
import { cn } from '../lib/utils';

interface AnalyticsSectionProps {
  data: AppData | null;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ data }) => {
  // Must appear "closed" when the app opens, expandable on user tap
  const [isExpanded, setIsExpanded] = useState(false);

  const totalPayments = data?.payments.length || 0;
  const chartData = data?.members.map(m => ({
    name: m.name,
    count: data.payments.filter(p => p.payer === m.name).length,
    color: m.color
  })) || [];

  const maxCount = Math.max(...chartData.map(d => d.count), 0);
  const dynamicHeight = Math.max(90, chartData.length * 26 + 15);

  return (
    <section 
      className={cn(
        "glass-card transition-all duration-200 overflow-hidden",
        isExpanded ? "border-brand-green/30 shadow-xl" : "border-brand-green/10"
      )}
    >
      <div 
        className={cn(
          "h-[52px] sm:h-[54px] px-4 sm:px-5 flex items-center justify-between cursor-pointer group select-none transition-colors",
          isExpanded ? "bg-brand-green/5 border-b border-brand-border/60" : "hover:bg-white/[0.02]"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_8px_#00e660] shrink-0" />
          <h2 className="font-display font-bold uppercase tracking-widest text-[11px] sm:text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
            Statistiche Spese
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-dark border border-brand-border text-text-secondary shrink-0">
            {totalPayments} {totalPayments === 1 ? 'totale' : 'totali'}
          </span>
        </div>
        <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-5 sm:px-6 pb-5 sm:pb-6 overflow-hidden"
          >
            <div className="w-full font-mono pt-2" style={{ height: `${dynamicHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={chartData} 
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-brand-border)" strokeOpacity={0.5} />
                  <XAxis 
                    type="number"
                    allowDecimals={false}
                    domain={[0, maxCount > 0 ? maxCount + 1 : 5]}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} 
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }} 
                    width={75}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-brand-card)', 
                      border: '1px solid var(--color-brand-border)', 
                      borderRadius: '12px', 
                      color: 'var(--text-primary)' 
                    }}
                    formatter={(value: any) => [`${value} ${value === 1 ? 'pagamento' : 'pagamenti'}`, 'Totale']}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={10}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
