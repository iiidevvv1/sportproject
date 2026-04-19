import { useState } from 'react';
import { X, Star, Shield, Users } from 'lucide-react';
import { useGame, useGameStats } from '../hooks/useGame';
import { toDisplayStats } from '../lib/statsCalc';
import { STONE_COLORS } from '../types';
import PlayerComparisonTable from './PlayerComparisonTable';
import PlayerStatsCard from './PlayerStatsCard';

type TeamTab = 'comparison' | 'home' | 'away';

const POSITION_LABELS_FULL = ['Лид', 'Второй', 'Третий', 'Скип'];

interface LiveStatsModalProps {
  gameId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveStatsModal({ gameId, isOpen, onClose }: LiveStatsModalProps) {
  const [teamTab, setTeamTab] = useState<TeamTab>('comparison');
  const { data: game } = useGame(gameId);
  const { data: statsData, isLoading: statsLoading } = useGameStats(gameId);

  if (!isOpen) return null;

  if (statsLoading || !game || !statsData) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-slate-400 text-sm">Загрузка статистики...</div>
      </div>
    );
  }

  const { home, away } = toDisplayStats(statsData);
  const homeTotal = game.ends.reduce((acc, e) => acc + e.score_home, 0);
  const awayTotal = game.ends.reduce((acc, e) => acc + e.score_away, 0);
  const homeColor = STONE_COLORS[game.color_home];
  const awayColor = STONE_COLORS[game.color_away];

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9ff] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
        <h1 className="font-headline font-bold text-lg text-[#0d1c2e]">
          Статистика матча
        </h1>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Score block */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-headline text-sm font-bold text-[#0d1c2e] truncate max-w-[100px]">
                  {game.team_home}
                </span>
                <Star style={{ color: homeColor, fill: homeColor }} size={14} />
              </div>
              <span className="font-headline text-4xl font-extrabold text-primary">{homeTotal}</span>
            </div>
            <span className="font-headline text-xs text-slate-300 font-bold uppercase tracking-widest px-2">vs</span>
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield style={{ color: awayColor, fill: awayColor }} size={14} />
                <span className="font-headline text-sm font-bold text-[#0d1c2e] truncate max-w-[100px]">
                  {game.team_away}
                </span>
              </div>
              <span className="font-headline text-4xl font-extrabold text-primary">{awayTotal}</span>
            </div>
          </div>
        </section>

        {/* Tab navigation */}
        <nav className="flex items-center gap-4 px-1">
          <button
            onClick={() => setTeamTab('comparison')}
            className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${
              teamTab === 'comparison' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            <Users size={16} className="inline mr-1" />
            Сравнение
          </button>
          <button
            onClick={() => setTeamTab('home')}
            className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${
              teamTab === 'home' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            {game.team_home}
          </button>
          <button
            onClick={() => setTeamTab('away')}
            className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${
              teamTab === 'away' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            {game.team_away}
          </button>
        </nav>

        {/* Content by tab */}
        {teamTab === 'comparison' && (
          <PlayerComparisonTable
            home={home}
            away={away}
            homeColor={homeColor}
            awayColor={awayColor}
          />
        )}

        {teamTab === 'home' && (
          <div className="space-y-1">
            {home.players.map((player, idx) => (
              <PlayerStatsCard
                key={player.position}
                player={player}
                positionLabel={POSITION_LABELS_FULL[idx] ?? `Игрок ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {teamTab === 'away' && (
          <div className="space-y-1">
            {away.players.map((player, idx) => (
              <PlayerStatsCard
                key={player.position}
                player={player}
                positionLabel={POSITION_LABELS_FULL[idx] ?? `Игрок ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Return button */}
        <div className="pt-4 pb-8">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold text-sm shadow-md transition-colors hover:bg-primary/90"
          >
            Вернуться к игре
          </button>
        </div>
      </div>
    </div>
  );
}
