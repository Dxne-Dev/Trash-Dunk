import { TRAINING_LEVELS, type TrainingLevel } from "@/lib/trainingLevels";

interface LevelCompleteModalProps {
  levelIndex: number;
  timeSpent: number;
  score: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onQuit: () => void;
}

export function LevelCompleteModal({
  levelIndex,
  timeSpent,
  score,
  onNextLevel,
  onReplay,
  onQuit,
}: LevelCompleteModalProps) {
  const currentLevel: TrainingLevel | undefined = TRAINING_LEVELS[levelIndex];
  const hasNext = levelIndex + 1 < TRAINING_LEVELS.length;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md animate-in zoom-in-95"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-2xl border border-swish/70 bg-arena-950 p-6 shadow-2xl text-center">
        <div className="display text-[13px] tracking-[0.28em] text-swish uppercase font-bold">
          Mission Réussie ! 🏆
        </div>
        <div className="display mt-2 text-[38px] leading-tight text-chalk">
          {currentLevel ? currentLevel.title : "Niveau Terminé"}
        </div>
        <div className="mt-2 text-2xl">⭐⭐⭐</div>

        <div className="mt-5 grid grid-cols-2 gap-2 overflow-hidden rounded-lg border border-arena-800 bg-arena-900/80 p-3">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-chalk-dim tracking-wider uppercase">Temps</span>
            <span className="display text-[22px] text-chalk">{timeSpent}s</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-chalk-dim tracking-wider uppercase">Score</span>
            <span className="display text-[22px] text-gold">{score.toLocaleString("fr-FR")}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {hasNext ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="w-full cursor-pointer rounded-lg bg-swish px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-swish/90 active:scale-95 shadow-lg shadow-swish/20"
            >
              Niveau Suivant ➔
            </button>
          ) : (
            <div className="rounded-lg bg-gold/20 border border-gold/50 p-3 text-sm font-bold text-gold">
              👑 Camp d'entraînement terminé à 100% ! Vous êtes le MVP !
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="flex-1 cursor-pointer rounded-lg border border-arena-700 bg-arena-850 px-4 py-2.5 text-xs font-semibold text-chalk transition hover:bg-arena-800 active:scale-95"
            >
              Rejouer ce niveau 🔄
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="flex-1 cursor-pointer rounded-lg bg-dunk-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-dunk-400 active:scale-95"
            >
              Quitter [Échap]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
