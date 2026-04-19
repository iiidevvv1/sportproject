import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, BarChart2, Users, Star, Shield, Sigma, Trash2, RotateCcw } from 'lucide-react';
import Header from '../components/Header';
import PlayerComparisonTable from '../components/PlayerComparisonTable';
import PlayerStatsCard from '../components/PlayerStatsCard';
import { useGame, useGameStats, useDeleteGame, useResumeGame } from '../hooks/useGame';
import { toDisplayStats } from '../lib/statsCalc';
import { STONE_COLORS } from '../types';

type Tab = 'overall' | 'home' | 'away';

export default function Stats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);

  const [tab, setTab] = useState<Tab>('overall');

  const { data: game, isLoading: gameLoading } = useGame(gameId);
  const { data: statsData, isLoading: statsLoading } = useGameStats(gameId);
  const deleteGame = useDeleteGame();
  const resumeGame = useResumeGame();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (gameLoading || statsLoading || !game || !statsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  const { home, away } = toDisplayStats(statsData);

  const homeTotal = game.ends.reduce((acc, e) => acc + e.score_home, 0);
  const awayTotal = game.ends.reduce((acc, e) => acc + e.score_away, 0);

  const homeColor = STONE_COLORS[game.color_home];
  const awayColor = STONE_COLORS[game.color_away];
  const totalEnds = Math.max(game.max_ends, game.ends.length);

  const POSITION_LABELS_FULL = ['Лид', 'Второй', 'Третий', 'Скип'];

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-24">
      <Header
        leftIcon={
          <button
            onClick={() => void navigate('/')}
            className="text-primary active:scale-95 transition-transform"
          >
            <ChevronLeft size={28} />
          </button>
        }
        centerContent={
          <h1 className="font-headline font-bold tracking-tight text-lg text-[#0d1c2e]">
            {tab === 'overall' ? 'Статистика матча' : tab === 'home' ? game.team_home : game.team_away}
          </h1>
        }
      />

      {/* Tab navigation */}
      <div className="fixed top-[60px] w-full z-40 bg-white border-b border-slate-100 px-6 py-2">
        <nav className="flex items-center gap-8 overflow-x-auto">
          <button
            onClick={() => setTab('overall')}
            className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${
              tab === 'overall' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            Общая таблица
          </button>
          <button
            onClick={() => setTab('home')}
            className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${
              tab === 'home' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            {game.team_home}
          </button>
          <button
            onClick={() => setTab('away')}
            className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${
              tab === 'away' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            {game.team_away}
          </button>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-28 pb-8 space-y-8">
        {tab === 'overall' ? (
          <>
            {/* Score summary */}
            <section className="bg-white rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-100">
              <div className="flex flex-col items-center space-y-6 relative z-10">
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex flex-1 flex-col items-center text-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h2 className="font-headline text-lg font-extrabold text-[#0d1c2e] truncate max-w-[120px]">
                        {game.team_home}
                      </h2>
                      <Star style={{ color: homeColor, fill: homeColor }} size={16} />
                    </div>
                    <span className="font-headline text-5xl font-extrabold text-primary">{homeTotal}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-headline text-xs text-slate-300 font-bold uppercase tracking-widest px-2">vs</span>
                  </div>
                  <div className="flex flex-1 flex-col items-center text-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield style={{ color: awayColor, fill: awayColor }} size={16} />
                      <h2 className="font-headline text-lg font-extrabold text-[#0d1c2e] truncate max-w-[120px]">
                        {game.team_away}
                      </h2>
                    </div>
                    <span className="font-headline text-5xl font-extrabold text-primary">{awayTotal}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Score by ends */}
            <section className="space-y-3">
              <h3 className="font-headline text-lg font-bold text-[#0d1c2e] flex items-center gap-2 px-2">
                <BarChart2 className="text-primary" size={20} />
                Счет по эндам
              </h3>
              <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-3 text-center">
                        <Users size={16} className="text-primary mx-auto" />
                      </th>
                      {Array.from({ length: totalEnds }).map((_, i) => (
                        <th key={i} className="px-1 py-3 text-center font-headline text-xs font-bold text-slate-400">
                          {i + 1}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right font-headline text-xs font-extrabold text-primary">
                        <Sigma size={20} strokeWidth={3} className="ml-auto" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="px-3 py-4 text-center">
                        <Star
                          size={20}
                          style={{ color: homeColor, fill: homeColor }}
                          className="mx-auto"
                        />
                      </td>
                      {Array.from({ length: totalEnds }).map((_, i) => {
                        const end = game.ends.find((e) => e.number === i + 1);
                        if (!end) return <td key={i} className="px-1 py-4 text-center text-sm text-slate-400">-</td>;
                        
                        const isPlaceholder = (end as any).status === 'placeholder';
                        const display = isPlaceholder ? 'X' : end.score_home;
                        const s = end.score_home;
                        
                        return (
                          <td
                            key={i}
                            className={`px-1 py-4 text-center text-sm ${s > 0 ? 'text-primary font-bold' : isPlaceholder ? 'text-slate-300' : 'text-slate-400'}`}
                          >
                            {display}
                          </td>
                        );
                      })}
                      <td
                        className="px-3 py-4 text-right font-headline text-xl font-black text-primary"
                        style={{ backgroundColor: `${homeColor}15` }}
                      >
                        {homeTotal}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-4 text-center">
                        <Shield
                          size={20}
                          style={{ color: awayColor, fill: awayColor }}
                          className="mx-auto"
                        />
                      </td>
                      {Array.from({ length: totalEnds }).map((_, i) => {
                        const end = game.ends.find((e) => e.number === i + 1);
                        if (!end) return <td key={i} className="px-1 py-4 text-center text-sm text-slate-400">-</td>;
                        
                        const isPlaceholder = (end as any).status === 'placeholder';
                        const display = isPlaceholder ? 'X' : end.score_away;
                        const s = end.score_away;
                        
                        return (
                          <td
                            key={i}
                            className={`px-1 py-4 text-center text-sm ${s > 0 ? 'text-primary font-bold' : isPlaceholder ? 'text-slate-300' : 'text-slate-400'}`}
                          >
                            {display}
                          </td>
                        );
                      })}
                      <td
                        className="px-3 py-4 text-right font-headline text-xl font-black text-primary"
                        style={{ backgroundColor: `${awayColor}15` }}
                      >
                        {awayTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Player comparison table */}
            <section className="space-y-4">
              <h3 className="font-headline text-lg font-bold text-[#0d1c2e] flex items-center gap-2 px-2">
                <Users className="text-primary" size={20} />
                Сравнение игроков
              </h3>
              <PlayerComparisonTable
                home={home}
                away={away}
                homeColor={homeColor}
                awayColor={awayColor}
              />
            </section>
          </>
        ) : tab === 'home' ? (
          /* Home team tab */
          <div className="space-y-1">
            {home.players.map((player, idx) => (
              <PlayerStatsCard
                key={player.position}
                player={player}
                positionLabel={POSITION_LABELS_FULL[idx] ?? `Игрок ${idx + 1}`}
              />
            ))}
          </div>
        ) : (
          /* Away team tab */
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

        {/* Game actions */}
        {game.status === 'finished' && (
          <div className="pt-8 pb-8 space-y-3">
            <button
              onClick={() => {
                resumeGame.mutate(gameId, {
                  onSuccess: () => void navigate(`/games/${gameId}/play?review=1`),
                });
              }}
              disabled={resumeGame.isPending}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-primary text-white font-headline font-bold text-sm transition-colors shadow-md disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Вернуться в игру
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 font-headline font-bold text-sm transition-colors"
            >
              <Trash2 size={16} />
              Удалить игру
            </button>
          </div>
        )}

        {/* Continue active game */}
        {game.status === 'active' && (
          <div className="pt-8 pb-8">
            <button
              onClick={() => void navigate(`/games/${gameId}/play`)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-primary text-white font-headline font-bold text-sm transition-colors shadow-md hover:bg-primary/90"
            >
              <ChevronLeft size={16} />
              Продолжить игру
            </button>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <h3 className="font-headline font-bold text-xl text-[#0d1c2e]">
              Вы уверены, что хотите удалить?
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  deleteGame.mutate(gameId, {
                    onSuccess: () => void navigate('/'),
                  });
                }}
                disabled={deleteGame.isPending}
                className="w-full py-4 rounded-xl bg-red-500 text-white font-headline font-bold tracking-wide shadow-md disabled:opacity-60"
              >
                Да, удалить
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 rounded-xl border border-slate-200 text-slate-500 font-headline font-bold tracking-wide hover:bg-slate-50"
              >
                Нет, оставить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
