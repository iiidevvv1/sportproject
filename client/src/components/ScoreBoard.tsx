import { Hammer } from 'lucide-react';
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
      <div className="flex items-center gap-2">
        {hammerThisEnd === 'home' && (
          <Hammer size={18} style={{ color: STONE_COLORS[game.color_home] }} />
        )}
        <span
          className="font-headline font-extrabold text-xl"
          style={{ color: STONE_COLORS[game.color_home] }}
        >
          {totalHome}
        </span>
      </div>
      <span className="font-headline font-extrabold text-xl text-slate-300">:</span>
      <div className="flex items-center gap-2">
        <span
          className="font-headline font-extrabold text-xl"
          style={{ color: STONE_COLORS[game.color_away] }}
        >
          {totalAway}
        </span>
        {hammerThisEnd === 'away' && (
          <Hammer size={18} style={{ color: STONE_COLORS[game.color_away] }} />
        )}
      </div>
    </div>
  );
}
