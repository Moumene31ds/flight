import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: ReactNode;
  color?: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';
}

export default function StatCard({ title, value, subValue, icon, color = 'cyan' }: StatCardProps) {
  const glowColors = {
    cyan: 'shadow-[0_0_20px_rgba(6,182,212,0.15)] border-brand-cyan/20 hover:border-brand-cyan/40',
    emerald: 'shadow-[0_0_20px_rgba(16,185,129,0.15)] border-brand-emerald/20 hover:border-brand-emerald/40',
    violet: 'shadow-[0_0_20px_rgba(139,92,246,0.15)] border-brand-violet/20 hover:border-brand-violet/40',
    amber: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] border-brand-amber/20 hover:border-brand-amber/40',
    rose: 'shadow-[0_0_20px_rgba(244,63,94,0.15)] border-brand-rose/20 hover:border-brand-rose/40',
  };

  const bgGlows = {
    cyan: 'bg-brand-cyan/10 text-brand-cyan',
    emerald: 'bg-brand-emerald/10 text-brand-emerald',
    violet: 'bg-brand-violet/10 text-brand-violet',
    amber: 'bg-brand-amber/10 text-brand-amber',
    rose: 'bg-brand-rose/10 text-brand-rose',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-panel p-5 rounded-2xl flex items-center justify-between transition-all duration-300 relative overflow-hidden group ${glowColors[color]}`}
    >
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-xl pointer-events-none group-hover:bg-white/[0.03] transition-all duration-300" />
      
      <div className="flex flex-col gap-1.5 z-10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {subValue && (
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">{subValue}</span>
        )}
      </div>

      <div className={`p-3.5 rounded-xl ${bgGlows[color]} flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
    </motion.div>
  );
}
