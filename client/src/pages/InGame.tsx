import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import ScoreBoard from '../components/ScoreBoard';
import ShotInput from '../components/ShotInput';
import EndResult from '../components/EndResult';
import { useGame, useFinishGame } from '../hooks/useGame';
import { useCreateShot, useCreateEnd } from '../hooks/useShots';
import { getShotInfo, getHammerForEnd } from '../lib/shotOrder';
import { STONE_COLORS, type ShotType, type TurnType, type ScoreValue, type TeamSide } from '../types';

const SHOTS_PER_END = 16;

export default function InGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);

  const { data: game, isLoading } = useGame(gameId);
  const createShot = useCreateShot(gameId);
  const createEnd = useCreateEnd(gameId);
  const finishGame = useFinishGame();

  const [shotType, setShotType] = useState<ShotType>('draw');
  const [shotTurn, setShotTurn] = useState<TurnType>('inturn');
  const [shotScore, setShotScore] = useState<ScoreValue>(100);
  const [isThrowaway, setIsThrowaway] = useState(false);
  const [showEndResult, setShowEndResult] = useState(false);
  const [showTieDialog, setShowTieDialog] = useState(false);

  if (isLoading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  // Determine current end and shot number from existing shots
  const shotsInGame = game.shots;

  // Group shots by end to find the current end
  const completedEnds = game.ends.length;
  const currentEnd = completedEnds + 1;

  // Shots in current end (not yet saved to an end)
  const shotsInCurrentEnd = shotsInGame.filter((s) => s.end_number === currentEnd);
  const currentShotNumber = shotsInCurrentEnd.length + 1;

  // Clamp shot number to valid range
  const effectiveShotNumber = Math.min(currentShotNumber, SHOTS_PER_END);
  const hammerThisEnd = getHammerForEnd(currentEnd, game.hammer_first_end, game.ends);
  const shotInfo = getShotInfo(effectiveShotNumber, hammerThisEnd);

  const isEndComplete = shotsInCurrentEnd.length >= SHOTS_PER_END;

  const handleNextShot = () => {
    if (isEndComplete) {
      setShowEndResult(true);
      return;
    }

    createShot.mutate({
      end_number: currentEnd,
      shot_number: currentShotNumber,
      team: shotInfo.team,
      player_number: shotInfo.playerNumber,
      type: isThrowaway ? null : shotType,
      turn: isThrowaway ? null : shotTurn,
      score: isThrowaway ? null : shotScore,
      is_throwaway: isThrowaway,
    });

    // Reset for next shot
    setShotType('draw');
    setShotTurn('inturn');
    setShotScore(100);
    setIsThrowaway(false);
  };

  const handleEndResult = (result: { scorer: TeamSide | null; stones: number }) => {
    const scoreHome = result.scorer === 'home' ? result.stones : 0;
    const scoreAway = result.scorer === 'away' ? result.stones : 0;

    createEnd.mutate(
      {
        number: currentEnd,
        score_home: scoreHome,
        score_away: scoreAway,
        hammer: hammerThisEnd,
      },
      {
        onSuccess: () => {
          setShowEndResult(false);

          if (currentEnd >= game.max_ends) {
            // Calculate total scores including this end
            const totalHome = game.ends.reduce((acc, e) => acc + e.score_home, 0) + scoreHome;
            const totalAway = game.ends.reduce((acc, e) => acc + e.score_away, 0) + scoreAway;

            if (totalHome === totalAway) {
              // Tie — ask about extra end
              setShowTieDialog(true);
            } else {
              // Not a tie — auto-finish game
              finishGame.mutate(gameId, {
                onSuccess: () => void navigate(`/games/${gameId}/stats`),
              });
            }
          }
        },
      },
    );
  };

  const handleExtraEnd = () => {
    setShowTieDialog(false);
    // Game continues — max_ends is just the default, we keep playing
  };

  const handleFinishTie = () => {
    setShowTieDialog(false);
    finishGame.mutate(gameId, {
      onSuccess: () => void navigate(`/games/${gameId}/stats`),
    });
  };

  const handleFinish = () => {
    if (!confirm('Завершить игру досрочно?')) return;
    finishGame.mutate(gameId, {
      onSuccess: () => void navigate('/'),
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-32">
      <Header
        leftIcon={
          <button
            onClick={() => void navigate('/')}
            className="text-primary active:scale-95 transition-transform"
          >
            <ChevronLeft size={28} />
          </button>
        }
        centerContent={<ScoreBoard game={game} currentEnd={currentEnd} />}
      />

      <main className="pt-20 px-6 max-w-2xl mx-auto space-y-5">
        {/* Current player info */}
        <section className="text-center space-y-2">
          <div className="flex flex-col items-center">
            <h2 className="font-headline flex items-center gap-2">
              <span className="text-xl font-extrabold text-[#0d1c2e]">{shotInfo.positionName}</span>
              <span className="text-lg font-extrabold text-slate-300">•</span>
              <span
                className="text-xl font-extrabold"
                style={{ color: STONE_COLORS[shotInfo.team === 'home' ? game.color_home : game.color_away] }}
              >
                {shotInfo.team === 'home' ? game.team_home : game.team_away}
              </span>
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <div className="inline-flex items-center px-4 py-1.5 rounded-2xl bg-blue-50">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-70">Энд</span>
                  <span className="text-xl font-black font-headline leading-none mt-0.5 text-primary">
                    {currentEnd}
                    <span className="text-xs opacity-40 ml-0.5">/{game.max_ends}</span>
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center px-4 py-1.5 bg-slate-100 rounded-2xl">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Камень</span>
                  <span className="text-xl font-black font-headline text-slate-600 leading-none mt-0.5">
                    {effectiveShotNumber}
                    <span className="text-xs opacity-40 ml-0.5">/16</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shot input */}
        {!isEndComplete && (
          <ShotInput
            type={shotType}
            turn={shotTurn}
            score={shotScore}
            isThrowaway={isThrowaway}
            onTypeChange={setShotType}
            onTurnChange={setShotTurn}
            onScoreChange={setShotScore}
            onThrowaway={() => setIsThrowaway(!isThrowaway)}
          />
        )}

        {/* Finish early button */}
        <div className="pt-2 space-y-8">
          {isEndComplete && (
            <button
              onClick={() => setShowEndResult(true)}
              className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold tracking-wide shadow-md"
            >
              Записать результат энда
            </button>
          )}
          <button
            onClick={handleFinish}
            className="w-full flex items-center justify-center p-4 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 font-headline font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            Завершить досрочно
          </button>
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
        <button
          onClick={() => void navigate('/')}
          className="flex items-center justify-center text-primary transition-colors"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={handleNextShot}
          disabled={createShot.isPending}
          className="flex items-center justify-center text-primary transition-colors disabled:opacity-40"
        >
          <ChevronRight size={32} />
        </button>
      </footer>

      {/* End result modal */}
      {showEndResult && (
        <EndResult
          teamHome={game.team_home}
          teamAway={game.team_away}
          endNumber={currentEnd}
          onSubmit={handleEndResult}
        />
      )}

      {/* Tie dialog */}
      {showTieDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <h3 className="font-headline font-bold text-xl text-[#0d1c2e]">
              Игра завершилась вничью
            </h3>
            <p className="text-slate-500 text-sm">
              Добавить экстра-энд или завершить игру?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleExtraEnd}
                className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold tracking-wide shadow-md"
              >
                Экстра-энд
              </button>
              <button
                onClick={handleFinishTie}
                className="w-full py-4 rounded-xl border border-slate-200 text-slate-500 font-headline font-bold tracking-wide hover:bg-slate-50"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
