import { TRAINING_LEVELS, type TrainingLevel } from "@/lib/trainingLevels";

interface LevelFailedModalProps {
  levelIndex: number;
  reason: string;
  onRetry: () => void;
  onQuit: () => void;
}

export function LevelFailedModal({
  levelIndex,
  reason,
  onRetry,
  onQuit,
}: LevelFailedModalProps) {
  const currentLevel: TrainingLevel | undefined = TRAINING_LEVELS[levelIndex];

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md animate-in zoom-in-95"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/70 bg-arena-950 p-6 shadow-2xl text-center">
        <div className="display text-[13px] tracking-[0.28em] text-red-400 uppercase font-bold">
          Temps Écoulé ! ⌛
        </div>
        <div className="display mt-2 text-[32px] leading-tight text-chalk">
          {currentLevel ? currentLevel.title : "Défi Manqué"}
        </div>
        <p className="mt-2 text-xs text-chalk-dim">{reason}</p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="w-full cursor-pointer rounded-lg bg-dunk-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-dunk-400 active:scale-95 shadow-lg shadow-dunk-500/20"
          >
            Recommencer (Niveau 1) 🔄
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="w-full cursor-pointer rounded-lg border border-arena-700 bg-arena-850 px-4 py-2.5 text-xs font-semibold text-chalk transition hover:bg-arena-800 active:scale-95"
          >
            Quitter [Échap]
          </button>
        </div>
      </div>
    </div>
  );
}
