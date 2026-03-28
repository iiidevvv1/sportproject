import { Crosshair, XCircle, RotateCw, RotateCcw, Ban } from 'lucide-react';
import { SCORE_COLORS, type ShotType, type TurnType, type ScoreValue } from '../types';

interface ShotInputProps {
  type: ShotType;
  turn: TurnType;
  score: ScoreValue;
  isThrowaway: boolean;
  onTypeChange: (type: ShotType) => void;
  onTurnChange: (turn: TurnType) => void;
  onScoreChange: (score: ScoreValue) => void;
  onThrowaway: () => void;
}

const SCORES: ScoreValue[] = [0, 25, 50, 75, 100];

export default function ShotInput({
  type,
  turn,
  score,
  isThrowaway,
  onTypeChange,
  onTurnChange,
  onScoreChange,
  onThrowaway,
}: ShotInputProps) {
  return (
    <div className="space-y-5">
      {/* Shot Type */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Тип броска</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onTypeChange('draw')}
            disabled={isThrowaway}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-[0.98] ${
              type === 'draw' && !isThrowaway
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Crosshair size={26} className="mb-1" />
            <span className="font-bold tracking-wide text-sm">Draw</span>
          </button>
          <button
            onClick={() => onTypeChange('takeout')}
            disabled={isThrowaway}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-[0.98] ${
              type === 'takeout' && !isThrowaway
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <XCircle size={26} className="mb-1" />
            <span className="font-bold tracking-wide text-sm">Takeout</span>
          </button>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Вращение</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onTurnChange('inturn')}
            disabled={isThrowaway}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-[0.98] ${
              turn === 'inturn' && !isThrowaway
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <RotateCw size={26} className="mb-1" />
            <span className="font-bold tracking-wide text-sm">In</span>
          </button>
          <button
            onClick={() => onTurnChange('outturn')}
            disabled={isThrowaway}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-[0.98] ${
              turn === 'outturn' && !isThrowaway
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <RotateCcw size={26} className="mb-1" />
            <span className="font-bold tracking-wide text-sm">Out</span>
          </button>
        </div>
      </div>

      {/* Score */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Оценка выполнения</h3>
        <div className="flex justify-between items-center gap-2">
          {SCORES.map((val) => (
            <button
              key={val}
              onClick={() => onScoreChange(val)}
              disabled={isThrowaway}
              className={`flex-1 aspect-square flex items-center justify-center rounded-xl text-white font-bold text-sm transition-all ${
                score === val && !isThrowaway
                  ? 'scale-110 ring-4 ring-white shadow-xl opacity-100'
                  : 'opacity-40 hover:opacity-100'
              }`}
              style={{ backgroundColor: SCORE_COLORS[val] }}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      {/* Throwaway */}
      <div className="pt-2">
        <button
          onClick={onThrowaway}
          className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all active:scale-[0.99] ${
            isThrowaway
              ? 'bg-red-50 border-red-200 text-red-500'
              : 'border-slate-200 text-slate-400 hover:bg-slate-50'
          }`}
        >
          <Ban size={18} />
          <span className="font-headline font-bold uppercase tracking-widest text-xs">Проброс</span>
        </button>
      </div>
    </div>
  );
}
