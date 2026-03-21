import { useNavigate } from 'react-router';
import { Target, Plus, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import GameCard from '../components/GameCard';
import { useGames } from '../hooks/useGame';
import { STONE_COLORS } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: games = [], isLoading } = useGames();

  const activeGame = games.find((g) => g.status === 'active');
  const completedGames = games.filter((g) => g.status === 'finished');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header
        leftIcon={<Target className="text-primary" size={24} />}
        centerContent={
          <h1 className="font-headline font-bold tracking-tight text-lg text-primary">Керлинг Стат</h1>
        }
      />

      <main className="pt-20 px-6 py-8 space-y-8">
        <header className="space-y-1">
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#0d1c2e]">Центр игры</h2>
          <p className="text-slate-500 text-sm">Точность на льду под контролем</p>
        </header>

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
              {completedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  ends={[]}
                  totalHome={0}
                  totalAway={0}
                />
              ))}
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

      {/* FAB for new game when there's an active game */}
      {activeGame && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => void navigate('/games/new')}
            className="w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
