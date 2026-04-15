import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, MapPin, Check } from 'lucide-react';
import Header from '../components/Header';
import ScoreBoard from '../components/ScoreBoard';
import ShotInput from '../components/ShotInput';
import EndResult from '../components/EndResult';
import StoneTracker from '../components/StoneTracker';
import { EarlyFinishDialog } from '../components/EarlyFinishDialog';
import { useGame, useFinishGame } from '../hooks/useGame';
import { useCreateShot, useUpdateShot, useCreateEnd } from '../hooks/useShots';
import { getShotInfo, getHammerForEnd } from '../lib/shotOrder';
import { STONE_COLORS, type ShotType, type TurnType, type ScoreValue, type TeamSide, type Shot } from '../types';

const SHOTS_PER_END = 16;

export default function InGame() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = Number(id);

  // If came from "resume" (Stats page), start in review mode at first shot
  const isResumeMode = searchParams.get('review') === '1';

  const { data: game, isLoading } = useGame(gameId);
  const createShot = useCreateShot(gameId);
  const updateShot = useUpdateShot(gameId);
  const createEnd = useCreateEnd(gameId);
  const finishGame = useFinishGame();

  // viewIndex: which shot position we're viewing (0-based index into all shots)
  // null = "new shot" position (past the last recorded shot)
  // For resume mode, start at 0 (first shot)
  const [viewIndex, setViewIndex] = useState<number | null>(isResumeMode ? 0 : null);

  const [shotType, setShotType] = useState<ShotType>('draw');
  const [shotTurn, setShotTurn] = useState<TurnType>('inturn');
  const [shotScore, setShotScore] = useState<ScoreValue>(100);
  const [isThrowaway, setIsThrowaway] = useState(false);
  const [showEndResult, setShowEndResult] = useState(false);
  const [showTieDialog, setShowTieDialog] = useState(false);
  const [showEndOfGameDialog, setShowEndOfGameDialog] = useState(false);
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [showEarlyFinishDialog, setShowEarlyFinishDialog] = useState(false);
  const [isEarlyFinishing, setIsEarlyFinishing] = useState(false);
  // Track if current viewed shot was edited
  const [isDirty, setIsDirty] = useState(false);
  // Track if any shot was edited in this session (for badge)
  const [hasEdited, setHasEdited] = useState(false);
  // Track if first shot has been loaded in resume mode
  const [resumeLoaded, setResumeLoaded] = useState(false);

  // All shots sorted by end then shot number
  // ALL hooks MUST be before early return to satisfy Rules of Hooks
  const allShots = useMemo(
    () => {
      if (!game?.shots || !Array.isArray(game.shots)) {
        return [];
      }
      return [...game.shots].sort(
        (a, b) => a.end_number - b.end_number || a.shot_number - b.shot_number,
      );
    },
    [game?.shots],
  );

  // Load viewed shot data into form
  const loadShotIntoForm = useCallback((shot: Shot) => {
    setShotType((shot.type as ShotType) ?? 'draw');
    setShotTurn((shot.turn as TurnType) ?? 'inturn');
    setShotScore((shot.score as ScoreValue) ?? 100);
    setIsThrowaway(Boolean(shot.is_throwaway));
    setIsDirty(false);
  }, []);

  // Reset form to defaults for new shot
  const resetForm = useCallback(() => {
    setShotType('draw');
    setShotTurn('inturn');
    setShotScore(100);
    setIsThrowaway(false);
    setIsDirty(false);
  }, []);

  // Load first shot in resume mode (once)
  useEffect(() => {
    if (isResumeMode && !resumeLoaded && allShots.length > 0 && viewIndex === 0) {
      const shot = allShots[0]!;
      setShotType((shot.type as ShotType) ?? 'draw');
      setShotTurn((shot.turn as TurnType) ?? 'inturn');
      setShotScore((shot.score as ScoreValue) ?? 100);
      setIsThrowaway(Boolean(shot.is_throwaway));
      setIsDirty(false);
      setResumeLoaded(true);
    }
  }, [isResumeMode, resumeLoaded, viewIndex, allShots]);

  if (isLoading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  const completedEnds = (game.ends && Array.isArray(game.ends)) ? game.ends.length : 0;
  const isViewingExisting = viewIndex !== null && viewIndex < allShots.length;
  const viewedShot: Shot | undefined = isViewingExisting ? allShots[viewIndex] : undefined;

  // Current end/shot for the "new shot" position
  const currentEnd = completedEnds + 1;
  const shotsInCurrentEnd = allShots.filter((s) => s.end_number === currentEnd);
  const currentShotNumber = shotsInCurrentEnd.length + 1;

  // The end/shot we're displaying
  const displayEnd = viewedShot ? viewedShot.end_number : currentEnd;
  const displayShotNumber = viewedShot ? viewedShot.shot_number : Math.min(currentShotNumber, SHOTS_PER_END);

  // For StoneTracker: show from currentShotNumber in normal mode, or from viewedShot in review
  const trackerShotNumber = isViewingExisting ? (viewedShot?.shot_number ?? 1) : currentShotNumber;

  const hammerThisEnd = getHammerForEnd(displayEnd, game.hammer_first_end, game.ends);
  const shotInfo = getShotInfo(displayShotNumber, hammerThisEnd);

  const isEndComplete = !isViewingExisting && shotsInCurrentEnd.length >= SHOTS_PER_END;

  // Get unique end numbers from shots
  const endNumbers = [...new Set(allShots.map((s) => s.end_number))].sort((a, b) => a - b);

  // Mark dirty on any change
  const handleTypeChange = (v: ShotType) => { setShotType(v); setIsDirty(true); };
  const handleTurnChange = (v: TurnType) => { setShotTurn(v); setIsDirty(true); };
  const handleScoreChange = (v: ScoreValue) => { setShotScore(v); setIsDirty(true); };
  const handleThrowaway = () => { setIsThrowaway(!isThrowaway); setIsDirty(true); };

  // Save current dirty shot if editing
  const saveDirtyShot = () => {
    if (isDirty && viewedShot) {
      updateShot.mutate({
        shotNumber: viewedShot.shot_number,
        end_number: viewedShot.end_number,
        type: isThrowaway ? null : shotType,
        turn: isThrowaway ? null : shotTurn,
        score: isThrowaway ? null : shotScore,
        is_throwaway: isThrowaway,
      });
      setHasEdited(true);
      setIsDirty(false);
    }
  };

  // Jump to specific end/shot
  const handleJump = (endNum: number, shotNum: number) => {
    const idx = allShots.findIndex((s) => s.end_number === endNum && s.shot_number === shotNum);
    if (idx >= 0) {
      saveDirtyShot();
      setViewIndex(idx);
      loadShotIntoForm(allShots[idx]!);
    }
    setShowJumpDialog(false);
  };

  // Navigate to previous shot
  const handlePrev = () => {
    saveDirtyShot();
    if (isViewingExisting && viewIndex > 0) {
      const prevShot = allShots[viewIndex - 1]!;
      setViewIndex(viewIndex - 1);
      loadShotIntoForm(prevShot);
    } else if (!isViewingExisting && allShots.length > 0) {
      const lastIdx = allShots.length - 1;
      setViewIndex(lastIdx);
      loadShotIntoForm(allShots[lastIdx]!);
    } else if (isViewingExisting && viewIndex === 0) {
      // At first shot — go home
      void navigate('/');
    } else {
      void navigate('/');
    }
  };

  // Navigate to next shot / save
  const handleNext = () => {
    if (isViewingExisting) {
      // If dirty, save changes first
      if (isDirty && viewedShot) {
        updateShot.mutate({
          shotNumber: viewedShot.shot_number,
          end_number: viewedShot.end_number,
          type: isThrowaway ? null : shotType,
          turn: isThrowaway ? null : shotTurn,
          score: isThrowaway ? null : shotScore,
          is_throwaway: isThrowaway,
        });
        setHasEdited(true);
      }

      // Move to next
      if (viewIndex < allShots.length - 1) {
        const nextShot = allShots[viewIndex + 1]!;
        setViewIndex(viewIndex + 1);
        loadShotIntoForm(nextShot);
      } else {
        // Past last existing shot — show dialog: continue or finish?
        setShowEndOfGameDialog(true);
      }
    } else {
      // New shot mode
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

      resetForm();
    }
  };

  const handleSaveAndFinish = () => {
    saveDirtyShot();
    finishGame.mutate(gameId, {
      onSuccess: () => void navigate(`/games/${gameId}/stats`),
    });
  };

  const handleContinueGame = () => {
    setShowEndOfGameDialog(false);
    setViewIndex(null);
    resetForm();
  };

  const handleEndResult = (result: { scorer: TeamSide | null; stones: number }) => {
    const scoreHome = result.scorer === 'home' ? result.stones : 0;
    const scoreAway = result.scorer === 'away' ? result.stones : 0;

    // If this is early finish (user clicked "Завершить досрочно" then "Ввести результат")
    if (isEarlyFinishing) {
      setShowEndResult(false);
      void handleFinishGameWithEarlyEnd(false, scoreHome, scoreAway);
      return;
    }

    // Normal end result (during active game play)
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
            const totalHome = game.ends.reduce((acc, e) => acc + e.score_home, 0) + scoreHome;
            const totalAway = game.ends.reduce((acc, e) => acc + e.score_away, 0) + scoreAway;

            if (totalHome === totalAway) {
              setShowTieDialog(true);
            } else {
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
  };

  const handleFinishTie = () => {
    setShowTieDialog(false);
    finishGame.mutate(gameId, {
      onSuccess: () => void navigate(`/games/${gameId}/stats`),
    });
  };

  const handleFinish = () => {
    setShowEarlyFinishDialog(true);
  };

  const handleEarlyFinish = (skipResult: boolean) => {
    setShowEarlyFinishDialog(false);
    
    if (skipResult) {
      // Skip result: don't record current end, just create placeholders and finish
      void handleFinishGameWithEarlyEnd(true);
    } else {
      // Record current end result via EndResult modal
      setIsEarlyFinishing(true);
      setShowEndResult(true);
    }
  };

  const handleFinishGameWithEarlyEnd = async (skipResult: boolean, scoreHome?: number, scoreAway?: number) => {
    try {
      const { earlyFinishGame } = await import('../api');
      const currentEnd = completedEnds + 1;
      
      await earlyFinishGame(gameId, {
        endNumber: currentEnd,
        skipResult,
        scoreHome: skipResult ? undefined : scoreHome,
        scoreAway: skipResult ? undefined : scoreAway,
      });

      navigate(`/games/${gameId}/stats`);
    } catch (error) {
      console.error('Error in early finish:', error);
      alert('Ошибка при завершении игры');
      setIsEarlyFinishing(false);
    }
  };

  // Badge text
  const badgeText = isViewingExisting
    ? (hasEdited || isDirty ? 'Редактирование' : 'Просмотр')
    : null;
  const badgeColor = hasEdited || isDirty ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-600';

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
        centerContent={<ScoreBoard game={game} currentEnd={displayEnd} />}
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
                    {displayEnd}
                    <span className="text-xs opacity-40 ml-0.5">/{game.max_ends}</span>
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center px-4 py-1.5 bg-slate-100 rounded-2xl">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Камень</span>
                  <span className="text-xl font-black font-headline text-slate-600 leading-none mt-0.5">
                    {displayShotNumber}
                    <span className="text-xs opacity-40 ml-0.5">/16</span>
                  </span>
                </div>
              </div>
              {badgeText && (
                <div className={`inline-flex items-center px-3 py-1.5 rounded-2xl ${badgeColor}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{badgeText}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stone tracker */}
        <section className="flex justify-center">
          <StoneTracker
            currentShotNumber={trackerShotNumber}
            colorFirst={hammerThisEnd === 'home' ? game.color_away : game.color_home}
            colorSecond={hammerThisEnd === 'home' ? game.color_home : game.color_away}
            isReview={isViewingExisting}
          />
        </section>

        {/* Shot input */}
        {!isEndComplete && (
          <ShotInput
            type={shotType}
            turn={shotTurn}
            score={shotScore}
            isThrowaway={isThrowaway}
            onTypeChange={handleTypeChange}
            onTurnChange={handleTurnChange}
            onScoreChange={handleScoreChange}
            onThrowaway={handleThrowaway}
          />
        )}

        {/* Action buttons */}
        <div className="pt-16 space-y-4">
          {isEndComplete && (
            <button
              onClick={() => setShowEndResult(true)}
              className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold tracking-wide shadow-md"
            >
              Записать результат энда
            </button>
          )}

          {/* Jump to shot button — only in review mode */}
          {isViewingExisting && allShots.length > 1 && (
            <button
              onClick={() => setShowJumpDialog(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-blue-200 text-blue-500 hover:bg-blue-50 font-headline font-bold text-sm transition-colors"
            >
              <MapPin size={16} />
              Перейти к броску…
            </button>
          )}

          {/* Save and finish — always visible in review mode */}
          {isViewingExisting && (
            <button
              onClick={handleSaveAndFinish}
              disabled={finishGame.isPending}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500 text-white hover:bg-green-600 font-headline font-bold text-sm transition-colors shadow-md disabled:opacity-60"
            >
              <Check size={16} />
              Сохранить и завершить
            </button>
          )}

          {!isViewingExisting && (
            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center p-4 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 font-headline font-bold uppercase tracking-widest text-[10px] transition-colors"
            >
              Завершить досрочно
            </button>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
        <button
          onClick={handlePrev}
          className="flex items-center justify-center text-primary transition-colors"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={handleNext}
          disabled={createShot.isPending || updateShot.isPending}
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

      {/* End of game dialog — continue or finish? */}
      {showEndOfGameDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <h3 className="font-headline font-bold text-xl text-[#0d1c2e]">
              Последний записанный бросок
            </h3>
            <p className="text-slate-500 text-sm">
              Продолжить игру (добавить новые броски) или сохранить и завершить?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinueGame}
                className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold tracking-wide shadow-md"
              >
                Продолжить игру
              </button>
              <button
                onClick={handleSaveAndFinish}
                disabled={finishGame.isPending}
                className="w-full py-4 rounded-xl border border-slate-200 text-slate-500 font-headline font-bold tracking-wide hover:bg-slate-50 disabled:opacity-60"
              >
                Сохранить и завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jump to shot dialog */}
      {showJumpDialog && (
        <JumpDialog
          endNumbers={endNumbers}
          allShots={allShots}
          onJump={handleJump}
          onClose={() => setShowJumpDialog(false)}
        />
      )}

      {/* Early finish dialog */}
      <EarlyFinishDialog
        open={showEarlyFinishDialog}
        onOpenChange={setShowEarlyFinishDialog}
        onConfirm={handleEarlyFinish}
      />

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

// Jump dialog component
function JumpDialog({
  endNumbers,
  allShots,
  onJump,
  onClose,
}: {
  endNumbers: number[];
  allShots: Shot[];
  onJump: (endNum: number, shotNum: number) => void;
  onClose: () => void;
}) {
  const [selectedEnd, setSelectedEnd] = useState(endNumbers[0] ?? 1);
  const shotsInEnd = allShots.filter((s) => s.end_number === selectedEnd);
  const shotNumbers = shotsInEnd.map((s) => s.shot_number).sort((a, b) => a - b);
  const [selectedShot, setSelectedShot] = useState(shotNumbers[0] ?? 1);

  // Reset shot when end changes
  const handleEndChange = (endNum: number) => {
    setSelectedEnd(endNum);
    const shots = allShots.filter((s) => s.end_number === endNum);
    setSelectedShot(shots[0]?.shot_number ?? 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
        <h3 className="font-headline font-bold text-lg text-[#0d1c2e] text-center">
          Перейти к броску
        </h3>

        {/* End selector */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Энд</label>
          <div className="flex flex-wrap gap-2">
            {endNumbers.map((e) => (
              <button
                key={e}
                onClick={() => handleEndChange(e)}
                className={`w-10 h-10 rounded-xl font-headline font-bold text-sm transition-colors ${
                  selectedEnd === e
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Shot selector */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Камень</label>
          <div className="flex flex-wrap gap-2">
            {shotNumbers.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedShot(s)}
                className={`w-10 h-10 rounded-xl font-headline font-bold text-sm transition-colors ${
                  selectedShot === s
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-headline font-bold text-sm hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            onClick={() => onJump(selectedEnd, selectedShot)}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-headline font-bold text-sm shadow-md"
          >
            Перейти
          </button>
        </div>
      </div>
    </div>
  );
}
