import { STONE_COLORS, type GameWithDetails } from '../types';
import { getHammerForEnd } from '../lib/shotOrder';

interface ScoreBoardProps {
  game: GameWithDetails;
  currentEnd: number;
}

export default function ScoreBoard({ game, currentEnd }: ScoreBoardProps) {
  const totalHome = game.ends.reduce((acc, e) => acc + e.score_home, 0);
  const totalAway = game.ends.reduce((acc, e) => acc + e.score_away, 0);
  const hammerThisEnd = getHammerForEnd(currentEnd, game.hammer_first_end, game.ends);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <span
          className="font-headline font-extrabold text-xl"
          style={{ color: STONE_COLORS[game.color_home] }}
        >
          {totalHome}
        </span>
        {hammerThisEnd === 'home' && (
          <span className="text-[10px] font-bold" style={{ color: STONE_COLORS[game.color_home] }}>Х</span>
        )}
      </div>
      <span className="font-headline font-extrabold text-xl text-slate-300">:</span>
      <div className="flex items-center gap-1">
        {hammerThisEnd === 'away' && (
          <span className="text-[10px] font-bold" style={{ color: STONE_COLORS[game.color_away] }}>Х</span>
        )}
        <span
          className="font-headline font-extrabold text-xl"
          style={{ color: STONE_COLORS[game.color_away] }}
        >
          {totalAway}
        </span>
      </div>
    </div>
  );
}
