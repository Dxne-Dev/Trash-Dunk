import { useEffect, useState } from "react";
import { TRAINING_LEVELS, type TrainingLevel } from "@/lib/trainingLevels";

interface TrainingHUDProps {
  levelIndex: number;
  basketsInLevel: number;
  swishesInLevel: number;
  streakInLevel: number;
  coldTriggered: boolean;
  timeLeft: number;
  onQuit: () => void;
}

export function TrainingHUD({
  levelIndex,
  basketsInLevel,
  swishesInLevel,
  streakInLevel,
  coldTriggered,
  timeLeft,
  onQuit,
}: TrainingHUDProps) {
  const level: TrainingLevel | undefined = TRAINING_LEVELS[levelIndex];
  if (!level) return null;

  // Progression textuelle
  let progressText = "";
  let currentVal = 0;
  let targetVal = 1;

  if (level.targetBaskets && level.targetSwishes) {
    progressText = `${basketsInLevel}/${level.targetBaskets} paniers (${swishesInLevel}/${level.targetSwishes} swishs)`;
    currentVal = basketsInLevel;
    targetVal = level.targetBaskets;
  } else if (level.targetBaskets) {
    progressText = `${basketsInLevel} / ${level.targetBaskets} paniers`;
    currentVal = basketsInLevel;
    targetVal = level.targetBaskets;
  } else if (level.targetSwishes) {
    progressText = `${swishesInLevel} / ${level.targetSwishes} swishs parfaits`;
    currentVal = swishesInLevel;
    targetVal = level.targetSwishes;
  } else if (level.targetStreak) {
    progressText = `Série en cours : ${streakInLevel} / ${level.targetStreak}`;
    currentVal = streakInLevel;
    targetVal = level.targetStreak;
  } else if (level.targetCold) {
    progressText = coldTriggered ? "Cold Ice activé ! ❄️" : "2 swishs d'affilée requis";
    currentVal = coldTriggered ? 1 : 0;
    targetVal = 1;
  }

  const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));
  const isUrgent = timeLeft <= 10;

  return (
    <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
      {/* Barre centrale mission */}
      <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-dunk-500/80 bg-arena-950/90 px-6 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {/* Badge Niveau */}
        <div className="flex flex-col">
          <span className="display text-[11px] uppercase tracking-wider text-dunk-400">
            {level.subtitle}
          </span>
          <span className="display text-[15px] leading-tight text-white font-bold">
            {level.title}
          </span>
        </div>

        <div className="h-8 w-px bg-arena-700/80" />

        {/* Objectif & Jauge */}
        <div className="flex flex-col min-w-[160px]">
          <div className="flex justify-between text-[11px] font-semibold text-chalk">
            <span>{progressText}</span>
            <span className="text-gold">{progressPct}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-arena-850 border border-arena-700/60">
            <div
              className="h-full bg-gradient-to-r from-dunk-500 to-swish transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="h-8 w-px bg-arena-700/80" />

        {/* Chrono */}
        <div className="flex items-center gap-2">
          <span className="text-base">⏱️</span>
          <div
            className={`display tnum text-[26px] leading-none font-bold ${
              isUrgent ? "text-red-400 animate-pulse" : "text-chalk"
            }`}
          >
            {timeLeft}s
          </div>
        </div>

        <div className="h-8 w-px bg-arena-700/80" />

        {/* Bouton abandonner */}
        <button
          type="button"
          onClick={onQuit}
          className="rounded-lg border border-arena-700 bg-arena-900/80 px-2.5 py-1.5 text-[11px] font-semibold text-chalk-dim hover:bg-arena-800 hover:text-chalk active:scale-95 transition"
        >
          Quitter [Échap]
        </button>
      </div>
    </div>
  );
}
