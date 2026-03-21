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
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <div
          className="w-2.5 h-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: STONE_COLORS[game.color_home] }}
        />
        {hammerThisEnd === 'home' && (
          <span className="text-[10px] font-bold" style={{ color: STONE_COLORS[game.color_home] }}>Х</span>
        )}
      </div>
      <span className="font-headline font-extrabold tracking-widest text-xl text-primary">
        {totalHome} : {totalAway}
      </span>
      <div className="flex items-center gap-1">
        {hammerThisEnd === 'away' && (
          <span className="text-[10px] font-bold" style={{ color: STONE_COLORS[game.color_away] }}>Х</span>
        )}
        <div
          className="w-2.5 h-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: STONE_COLORS[game.color_away] }}
        />
      </div>
    </div>
  );
}
