import type { ReactNode } from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  dark?: boolean;
  icon?: ReactNode;
  labelRight?: boolean;
}

export default function ProgressBar({ label, value, color, dark, icon, labelRight }: ProgressBarProps) {
  return (
    <div>
      <div className={`flex ${labelRight ? 'flex-row-reverse' : 'flex-row'} justify-between items-center text-[10px] mb-1.5`}>
        <div className={`flex ${labelRight ? 'flex-row-reverse' : 'flex-row'} items-center gap-1`}>
          {icon}
          <span className={`${dark ? 'text-sky-200/80' : 'text-slate-500'} font-medium`}>{label}</span>
        </div>
        <span className={`font-bold ${dark ? 'text-white' : 'text-[#0d1c2e]'}`}>{value}%</span>
      </div>
      <div className={`w-full ${dark ? 'bg-white/10' : 'bg-slate-100'} h-1.5 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
