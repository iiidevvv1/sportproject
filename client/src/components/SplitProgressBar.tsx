import { RotateCw, RotateCcw } from 'lucide-react';

interface SplitProgressBarProps {
  inValue: number;
  outValue: number;
  inColor: string;
  outColor: string;
}

export default function SplitProgressBar({ inValue, outValue, inColor, outColor }: SplitProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
        <div className="flex items-center gap-1">
          <RotateCw size={10} className="text-slate-400" />
          <span className="text-slate-500">In: {inValue}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Out: {outValue}%</span>
          <RotateCcw size={10} className="text-slate-400" />
        </div>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${inValue}%`, backgroundColor: inColor }}
        />
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${outValue}%`, backgroundColor: outColor }}
        />
      </div>
    </div>
  );
}
