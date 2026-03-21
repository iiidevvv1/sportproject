import { useNavigate } from 'react-router';
import { STONE_COLORS, type Game, type End } from '../types';

interface GameCardProps {
  game: Game;
  ends: End[];
  totalHome: number;
  totalAway: number;
}

export default function GameCard({ game, totalHome, totalAway }: GameCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (game.status === 'active') {
      void navigate(`/games/${game.id}/play`);
    } else {
      void navigate(`/games/${game.id}/stats`);
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleClick();
      }}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{game.date}</span>
        {game.status === 'active' && (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">В процессе</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center w-20">
          <div className="w-3 h-3 rounded-full mb-1 shadow-sm" style={{ backgroundColor: STONE_COLORS[game.color_home] }} />
          <span className="text-xs font-bold text-[#0d1c2e] truncate w-full text-center">{game.team_home}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-black text-[#0d1c2e]">{totalHome}</span>
          <div className="h-px w-4 bg-slate-200" />
          <span className="text-3xl font-black text-[#0d1c2e]">{totalAway}</span>
        </div>
        <div className="flex flex-col items-center w-20">
          <div className="w-3 h-3 rounded-full mb-1 shadow-sm" style={{ backgroundColor: STONE_COLORS[game.color_away] }} />
          <span className="text-xs font-bold text-[#0d1c2e] truncate w-full text-center">{game.team_away}</span>
        </div>
      </div>
    </div>
  );
}
