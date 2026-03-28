import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, BarChart2, Users, Star, Shield, Sigma } from 'lucide-react';
import Header from '../components/Header';
import { useGame, useGameStats } from '../hooks/useGame';
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
                      {Array.from({ length: game.max_ends }).map((_, i) => (
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
                      {Array.from({ length: game.max_ends }).map((_, i) => {
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
                      {Array.from({ length: game.max_ends }).map((_, i) => {
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
          /* My team tab - detailed player cards */
          <div className="space-y-6">
            {home.players.map((player, idx) => (
              <div
                key={player.position}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Header row */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-headline text-xl font-bold text-[#0d1c2e]">
                    {POSITION_LABELS_FULL[idx]}
                  </h3>
                  <div className="text-right text-lg font-bold text-slate-600">
                    {player.shotCount} / <span className="text-primary font-black">{player.avg}%</span>
                  </div>
                </div>

                {/* Table with Draw/Take, In, Out */}
                <div className="divide-y divide-slate-100">
                  {/* Row 1: Draw/Take headers with counts and percentages */}
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    <div className="px-6 py-4 text-base font-bold text-slate-600">
                      Draw {player.drawCount} / {player.drawAvg}%
                    </div>
                    <div className="px-6 py-4 text-base font-bold text-slate-600">
                      Take {player.takeoutCount} / {player.takeoutAvg}%
                    </div>
                  </div>

                  {/* Row 2: In */}
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    <div className="px-6 py-4 text-base text-slate-600">
                      In {player.drawInCount} / {player.inturnDrawAvg}%
                    </div>
                    <div className="px-6 py-4 text-base text-slate-600">
                      In {player.takeoutInCount} / {player.inturnTakeoutAvg}%
                    </div>
                  </div>

                  {/* Row 3: Out */}
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    <div className="px-6 py-4 text-base text-slate-600">
                      Out {player.drawOutCount} / {player.outturnDrawAvg}%
                    </div>
                    <div className="px-6 py-4 text-base text-slate-600">
                      Out {player.takeoutOutCount} / {player.outturnTakeoutAvg}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
