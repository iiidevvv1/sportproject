import { useState } from 'react';
import type { TeamSide } from '../types';

interface EndResultProps {
  teamHome: string;
  teamAway: string;
  endNumber: number;
  onSubmit: (result: { scorer: TeamSide | null; stones: number }) => void;
}

export default function EndResult({ teamHome, teamAway, endNumber, onSubmit }: EndResultProps) {
  const [scorer, setScorer] = useState<TeamSide | null>(null);
  const [stones, setStones] = useState(1);
  const [isBlank, setIsBlank] = useState(false);

  const handleSubmit = () => {
    if (isBlank) {
      onSubmit({ scorer: null, stones: 0 });
    } else if (scorer !== null) {
      onSubmit({ scorer, stones });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-6 shadow-2xl">
        <div className="text-center">
          <h2 className="font-headline text-xl font-bold text-[#0d1c2e]">
            Результат энда {endNumber}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Кто набрал очки?</p>
        </div>

        {/* Team selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setScorer('home'); setIsBlank(false); }}
            className={`py-4 px-3 rounded-xl font-headline font-bold text-sm transition-all ${
              scorer === 'home' && !isBlank
                ? 'bg-primary text-white shadow-md'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {teamHome}
          </button>
          <button
            onClick={() => { setScorer('away'); setIsBlank(false); }}
            className={`py-4 px-3 rounded-xl font-headline font-bold text-sm transition-all ${
              scorer === 'away' && !isBlank
                ? 'bg-primary text-white shadow-md'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {teamAway}
          </button>
        </div>

        {/* Stones count */}
        {scorer !== null && !isBlank && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Количество камней</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setStones(n)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    stones === n
                      ? 'bg-primary/10 text-primary border-2 border-primary/20'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Blank end */}
        <button
          onClick={() => { setIsBlank(!isBlank); setScorer(null); }}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            isBlank
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          Нулевой энд (0:0)
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isBlank && scorer === null}
          className="w-full py-4 rounded-xl bg-primary text-white font-headline font-extrabold text-base shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
}
