import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Target, Plus, ChevronRight, FileSpreadsheet } from 'lucide-react';
import Header from '../components/Header';
import GameCard from '../components/GameCard';
import { useGames } from '../hooks/useGame';
import { useVersion } from '../hooks/useVersion';
import { STONE_COLORS } from '../types';
import * as api from '../api';
import { exportGamesToExcel } from '../lib/exportExcel';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: games = [], isLoading } = useGames();
  const { version } = useVersion();
  const [isExportMode, setIsExportMode] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const activeGame = games.find((g) => g.status === 'active');
  const completedGames = games.filter((g) => g.status === 'finished');
  const selectedCount = selectedGameIds.length;

  const selectedGames = useMemo(
    () => completedGames.filter((game) => selectedGameIds.includes(game.id)),
    [completedGames, selectedGameIds],
  );

  const toggleGameSelection = (gameId: number) => {
    setSelectedGameIds((prev) =>
      prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId],
    );
  };

  const handleStartExportMode = () => {
    setExportError(null);
    setSelectedGameIds([]);
    setIsExportMode(true);
  };

  const handleCancelExportMode = () => {
    setIsExportMode(false);
    setSelectedGameIds([]);
    setExportError(null);
  };

  const handleExport = async () => {
    if (selectedGames.length === 0) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const detailedGames = [] as Array<Awaited<ReturnType<typeof api.getGame>>>;
      for (const game of selectedGames) {
        const detailedGame = await api.getGame(game.id);
        detailedGames.push(detailedGame);
      }

      await exportGamesToExcel(detailedGames);
      setIsExportMode(false);
      setSelectedGameIds([]);
    } catch (error) {
      console.error(error);
      setExportError('Не удалось собрать Excel. Попробуй ещё раз.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Header
        leftIcon={<Target className="text-primary" size={24} />}
        centerContent={
          <h1 className="font-headline font-bold tracking-tight text-lg text-primary">Керлинг Стат</h1>
        }
      />

      <main className="pt-20 px-6 py-8 space-y-8">
        {completedGames.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">ЭКСПОРТ</h3>
              {!isExportMode ? (
                <button
                  onClick={handleStartExportMode}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
                >
                  <FileSpreadsheet size={16} />
                  Выгрузка Excel
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelExportMode}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => void handleExport()}
                    disabled={selectedCount === 0 || isExporting}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isExporting ? 'Собираю .xlsx...' : 'Скачать .xlsx'}
                  </button>
                </div>
              )}
            </div>

            {isExportMode && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Выбрано игр: {selectedCount}</div>
                <div>Отметь завершённые матчи, которые нужно включить в один Excel-файл.</div>
                {exportError && <div className="text-red-600 font-medium">{exportError}</div>}
              </div>
            )}
          </section>
        )}

        {/* Active game section */}
        <section className="space-y-4">
          {activeGame && (
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">ТЕКУЩИЙ МАТЧ</h3>
            </div>
          )}

          {activeGame ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider shrink-0 text-primary">
                  <span>{activeGame.max_ends} эндов</span>
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">В процессе</span>
              </div>
              <div className="p-5">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-5 h-5 rounded-full stone-shadow shrink-0 shadow-sm"
                          style={{ backgroundColor: STONE_COLORS[activeGame.color_home] }}
                        />
                        <h4 className="font-headline font-bold text-lg text-[#0d1c2e] leading-tight truncate">
                          {activeGame.team_home}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px bg-slate-100 flex-1" />
                      <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">vs</span>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-5 h-5 rounded-full stone-shadow shrink-0 shadow-sm"
                          style={{ backgroundColor: STONE_COLORS[activeGame.color_away] }}
                        />
                        <h4 className="font-headline font-bold text-lg text-[#0d1c2e] leading-tight truncate">
                          {activeGame.team_away}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => void navigate(`/games/${activeGame.id}/play`)}
                    className="group w-full bg-primary text-white py-4 rounded-xl font-headline font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 shadow-primary/20"
                  >
                    <span>Продолжить игру</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => void navigate('/games/new')}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3 group hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="text-primary" size={20} />
              </div>
              <span className="font-headline font-bold text-sm text-slate-500">Новая игра</span>
            </button>
          )}
        </section>

        {/* Completed games */}
        {completedGames.length > 0 && (
          <section className="space-y-4">
            <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">ПРОШЕДШИЕ МАТЧИ</h3>
            <div className="space-y-4">
              {completedGames.map((game) => {
                if (!isExportMode) {
                  return (
                    <GameCard
                      key={game.id}
                      game={game}
                      ends={[]}
                      totalHome={game.score_home}
                      totalAway={game.score_away}
                    />
                  );
                }

                const isSelected = selectedGameIds.includes(game.id);
                return (
                  <label
                    key={game.id}
                    className={`flex items-start gap-4 rounded-xl border p-4 bg-white shadow-sm ${isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-slate-100'}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={isSelected}
                      onChange={() => toggleGameSelection(game.id)}
                      aria-label={`Выбрать игру ${game.team_home} — ${game.team_away}`}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{game.date}</span>
                        <span className="text-sm font-black text-primary">{game.score_home}:{game.score_away}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-headline font-bold text-[#0d1c2e]">{game.team_home}</div>
                        <div className="font-headline font-bold text-[#0d1c2e]">{game.team_away}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* No games state */}
        {games.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">Нет игр. Начните новую!</p>
          </div>
        )}
      </main>

      {/* Version footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 py-3 px-6 text-center">
        <p className="text-xs text-slate-400">Керлинг Стат • v{version?.version || '?.?.?'}</p>
      </footer>
    </div>
  );
}
