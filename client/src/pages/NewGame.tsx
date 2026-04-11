import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ArrowRight, Info } from 'lucide-react';
import Header from '../components/Header';
import ColorPicker from '../components/ColorPicker';
import { useCreateGame, useGames } from '../hooks/useGame';
import type { StoneColor, TeamSide } from '../types';

export default function NewGame() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createGame = useCreateGame();
  const { data: games = [] } = useGames();
  const hasActiveGame = games.some((g) => g.status === 'active');

  useEffect(() => {
    if (hasActiveGame) {
      void navigate('/');
    }
  }, [hasActiveGame, navigate]);

  const [ourName, setOurName] = useState('');
  const [ourColor, setOurColor] = useState<StoneColor>('red');
  const [oppName, setOppName] = useState('');
  const [oppColor, setOppColor] = useState<StoneColor>('yellow');

  const ALL_COLORS: StoneColor[] = ['red', 'yellow', 'blue', 'green'];
  const nextColor = (current: StoneColor, avoid: StoneColor): StoneColor => {
    const idx = ALL_COLORS.indexOf(current);
    for (let i = 1; i < ALL_COLORS.length; i++) {
      const candidate = ALL_COLORS[(idx + i) % ALL_COLORS.length] as StoneColor;
      if (candidate !== avoid) return candidate;
    }
    return current;
  };

  const handleOurColorChange = (color: StoneColor) => {
    setOurColor(color);
    if (color === oppColor) setOppColor(nextColor(oppColor, color));
  };

  const handleOppColorChange = (color: StoneColor) => {
    setOppColor(color);
    if (color === ourColor) setOurColor(nextColor(ourColor, color));
  };
  const [hammer, setHammer] = useState<TeamSide>('home');
  const [ends, setEnds] = useState(8);

  const handleCreate = () => {
    createGame.mutate(
      {
        team_home: ourName || 'Наша команда',
        team_away: oppName || 'Противник',
        color_home: ourColor,
        color_away: oppColor,
        hammer_first_end: hammer,
        max_ends: ends,
      },
      {
        onSuccess: (game) => {
          // Ensure game data is in cache before navigating
          void queryClient.setQueryData(['game', game.id], game);
          void navigate(`/games/${game.id}/play`);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-white">
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
          <h1 className="font-headline font-bold tracking-tight text-lg text-primary">Новая игра</h1>
        }
      />

      <main className="pt-24 pb-32 px-6 max-w-md mx-auto space-y-10">
        {/* Our team */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary transition-colors" />
            <h2 className="font-headline font-bold text-xl tracking-tight text-[#0d1c2e]">
              Наша команда
            </h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                Название команды
              </label>
              <input
                type="text"
                value={ourName}
                onChange={(e) => setOurName(e.target.value)}
                className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-[#0d1c2e] placeholder:text-slate-300"
                placeholder="Введите название..."
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                Цвет камней
              </label>
              <ColorPicker value={ourColor} onChange={handleOurColorChange} />
            </div>
          </div>
        </section>

        {/* Opponent team */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-slate-300 transition-colors" />
            <h2 className="font-headline font-bold text-xl tracking-tight text-[#0d1c2e]">Команда противника</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                Название команды
              </label>
              <input
                type="text"
                value={oppName}
                onChange={(e) => setOppName(e.target.value)}
                className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-[#0d1c2e] placeholder:text-slate-300"
                placeholder="Введите название..."
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                Цвет камней
              </label>
              <ColorPicker value={oppColor} onChange={handleOppColorChange} />
            </div>
          </div>
        </section>

        {/* Hammer */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg text-[#0d1c2e] px-1">Хаммер в 1-м энде</h2>
          <div className="bg-slate-50 p-1.5 rounded-xl flex gap-1">
            <button
              onClick={() => setHammer('home')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                hammer === 'home'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {ourName || 'Наша команда'}
            </button>
            <button
              onClick={() => setHammer('away')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                hammer === 'away'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {oppName || 'Противник'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 italic px-2 flex items-center gap-1">
            <Info size={12} />
            Команда с хаммером бросает последней
          </p>
        </section>

        {/* Ends count */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg text-[#0d1c2e] px-1">Количество эндов</h2>
          <div className="grid grid-cols-2 gap-4">
            {[8, 10].map((num) => (
              <button
                key={num}
                onClick={() => setEnds(num)}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${
                  ends === num
                    ? 'bg-primary/10 text-primary border-2 border-primary/20 shadow-inner'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-12">
        <button
          onClick={handleCreate}
          disabled={createGame.isPending}
          className="w-full py-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-headline font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {createGame.isPending ? 'Создание...' : 'Начать игру'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
