interface EarlyFinishDialogProps {
  currentEnd: number;
  maxEnds: number;
  onInputResult: () => void;
  onSkipResult: () => void;
}

export default function EarlyFinishDialog({
  currentEnd,
  maxEnds,
  onInputResult,
  onSkipResult,
}: EarlyFinishDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-6 shadow-2xl">
        <div className="text-center">
          <h2 className="font-headline text-xl font-bold text-[#0d1c2e]">
            Завершить игру досрочно?
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Энд {currentEnd} из {maxEnds}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Ввести результат этого энда?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onInputResult}
            className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold tracking-wide shadow-md hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            Ввести
          </button>
          <button
            onClick={onSkipResult}
            className="w-full py-4 rounded-xl border border-slate-200 text-slate-500 font-headline font-bold tracking-wide hover:bg-slate-50 transition-colors active:scale-[0.98]"
          >
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
}
