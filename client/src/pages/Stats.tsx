import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, BarChart2, Users, Star, Shield, Sigma, Trash2, RotateCcw } from 'lucide-react';
import Header from '../components/Header';
import { useGame, useGameStats, useDeleteGame, useResumeGame } from '../hooks/useGame';
import { toDisplayStats } from '../lib/statsCalc';
import { STONE_COLORS } from '../types';

type Tab = 'overall' | 'positions';

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

  const POSITION_LABELS = ['ЛИД', '2-Й', '3-Й', 'СКИП'];
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
            {tab === 'overall' ? 'Статистика матча' : 'Моя команда'}
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
            onClick={() => setTab('positions')}
            className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${
              tab === 'positions' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            Моя команда
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
                        const s = end ? end.score_home : 0;
                        return (
                          <td
                            key={i}
                            className={`px-1 py-4 text-center text-sm ${s > 0 ? 'text-primary font-bold' : 'text-slate-400'}`}
                          >
                            {s}
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
                        const s = end ? end.score_away : 0;
                        return (
                          <td
                            key={i}
                            className={`px-1 py-4 text-center text-sm ${s > 0 ? 'text-primary font-bold' : 'text-slate-400'}`}
                          >
                            {s}
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[360px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-2 py-4 text-[11px] font-bold uppercase tracking-tight text-slate-500 w-[16%]">Поз</th>
                        <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">
                          <div className="flex items-center justify-center space-x-1">
                            <Star size={16} style={{ color: homeColor, fill: homeColor }} />
                            <span>%</span>
                          </div>
                        </th>
                        <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">D</th>
                        <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">T</th>
                        <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">
                          <div className="flex items-center justify-center space-x-1">
                            <Shield size={16} style={{ color: awayColor, fill: awayColor }} />
                            <span>%</span>
                          </div>
                        </th>
                        <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">D</th>
                        <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">T</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {home.players.map((player, idx) => {
                        const awayPlayer = away.players[idx];
                        return (
                          <tr key={player.position} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-2 py-4 font-semibold text-xs border-r border-slate-50 text-slate-600">
                              {POSITION_LABELS[idx]}
                            </td>
                            <td className="px-1 py-4 text-center font-headline font-bold text-sm text-slate-900">
                              {player.avg}%
                            </td>
                            <td className="px-1 py-4 text-center text-xs text-slate-600">{player.drawAvg}%</td>
                            <td className="px-1 py-4 text-center text-xs text-slate-600">{player.takeoutAvg}%</td>
                            <td
                              className="px-1 py-4 text-center font-headline font-bold text-sm text-slate-900"
                              style={{ backgroundColor: `${awayColor}10` }}
                            >
                              {awayPlayer?.avg ?? 0}%
                            </td>
                            <td
                              className="px-1 py-4 text-center text-xs text-slate-600"
                              style={{ backgroundColor: `${awayColor}10` }}
                            >
                              {awayPlayer?.drawAvg ?? 0}%
                            </td>
                            <td
                              className="px-1 py-4 text-center text-xs text-slate-600"
                              style={{ backgroundColor: `${awayColor}10` }}
                            >
                              {awayPlayer?.takeoutAvg ?? 0}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary/10 border-t border-primary/20 font-bold">
                        <td className="px-2 py-4 text-center border-r border-primary/10">
                          <Sigma size={20} strokeWidth={3} className="mx-auto text-primary" />
                        </td>
                        <td className="px-1 py-4 text-center text-sm text-slate-900">{home.avg}%</td>
                        <td
                          className="px-1 py-4 text-[10px] text-slate-500 italic text-center"
                          colSpan={2}
                        >
                          Бросков: {home.shotCount}
                        </td>
                        <td className="px-1 py-4 text-center text-sm text-slate-900">{away.avg}%</td>
                        <td
                          className="px-1 py-4 text-[10px] text-slate-500 italic text-center"
                          colSpan={2}
                        >
                          Бросков: {away.shotCount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* My team tab - compact player cards, 4 per screen */
          <div className="space-y-2">
            {home.players.map((player, idx) => (
              <div
                key={player.position}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Header row */}
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-headline text-xl font-bold text-[#0d1c2e]">
                    {POSITION_LABELS_FULL[idx]}
                  </h3>
                  <div className="text-right text-lg font-bold text-slate-600">
                    {player.shotCount} / <span className="text-primary font-black">{player.avg}%</span>
                  </div>
                </div>

                {/* Table grid: label | count | % || label | count | % */}
                <div className="grid grid-cols-2 divide-x-2 divide-slate-200">
                  {/* Draw column */}
                  <div className="divide-y divide-slate-50">
                    <div className="grid grid-cols-[1fr_2.5rem_2rem_3.5rem] items-center px-4 py-1.5">
                      <span className="text-base font-bold text-slate-700">Draw</span>
                      <span className="text-base text-slate-500 text-right tabular-nums">{player.drawCount}</span>
                      <span></span>
                      <span className="text-base font-bold text-slate-700 text-right tabular-nums">{player.drawAvg}%</span>
                    </div>
                    <div className="grid grid-cols-[1fr_2.5rem_2rem_3.5rem] items-center px-4 py-1.5">
                      <span className="text-base text-slate-500">In</span>
                      <span className="text-base text-slate-400 text-right tabular-nums">{player.drawInCount}</span>
                      <span></span>
                      <span className="text-base text-slate-600 text-right tabular-nums">{player.inturnDrawAvg}%</span>
                    </div>
                    <div className="grid grid-cols-[1fr_2.5rem_2rem_3.5rem] items-center px-4 py-1.5">
                      <span className="text-base text-slate-500">Out</span>
                      <span className="text-base text-slate-400 text-right tabular-nums">{player.drawOutCount}</span>
                      <span></span>
                      <span className="text-base text-slate-600 text-right tabular-nums">{player.outturnDrawAvg}%</span>
                    </div>
                  </div>
                  {/* Take column */}
                  <div className="divide-y divide-slate-50">
                    <div className="grid grid-cols-[1fr_2.5rem_2rem_3.5rem] items-center px-4 py-1.5">
                      <span className="text-base font-bold text-slate-700">Take</span>
                      <span className="text-base text-slate-500 text-right tabular-nums">{player.takeoutCount}</span>
                      <span></span>
                      <span className="text-base font-bold text-slate-700 text-right tabular-nums">{player.takeoutAvg}%</span>
                    </div>
                    <div className="grid grid-cols-[1fr_2.5rem_2rem_3.5rem] items-center px-4 py-1.5">
                      <span className="text-base text-slate-500">In</span>
                      <span className="text-base text-slate-400 text-right tabular-nums">{player.takeoutInCount}</span>
                      <span></span>
                      <span className="text-base text-slate-600 text-right tabular-nums">{player.inturnTakeoutAvg}%</span>
                    </div>
                    <div className="grid grid-cols-[1fr_2.5rem_2rem_3.5rem] items-center px-4 py-1.5">
                      <span className="text-base text-slate-500">Out</span>
                      <span className="text-base text-slate-400 text-right tabular-nums">{player.takeoutOutCount}</span>
                      <span></span>
                      <span className="text-base text-slate-600 text-right tabular-nums">{player.outturnTakeoutAvg}%</span>
                    </div>
                  </div>
                </div>
              </div>
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
