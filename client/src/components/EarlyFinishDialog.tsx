interface EarlyFinishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (skipResult: boolean) => void;
}

export function EarlyFinishDialog({ open, onOpenChange, onConfirm }: EarlyFinishDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
        <h3 className="font-headline font-bold text-xl text-[#0d1c2e]">Завершить игру?</h3>
        <p className="text-slate-500 text-sm">Ввести результат текущего энда или пропустить?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirm(false);
              onOpenChange(false);
            }}
            className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold tracking-wide shadow-md"
          >
            Ввести результат
          </button>
          <button
            onClick={() => {
              onConfirm(true);
              onOpenChange(false);
            }}
            className="w-full py-4 rounded-xl border border-slate-200 text-slate-500 font-headline font-bold tracking-wide hover:bg-slate-50"
          >
            Пропустить
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-4 rounded-xl border border-slate-200 text-slate-500 font-headline font-bold tracking-wide hover:bg-slate-50"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
