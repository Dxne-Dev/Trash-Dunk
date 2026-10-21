import { useEffect, useState } from "react";

export function AutoDemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setProgress(0);
      return;
    }

    // Boucle d'animation automatique de déroulement
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % 5;
      setStep(currentStep as 0 | 1 | 2 | 3 | 4);
    }, 2400);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Jauge de tir simulée
  useEffect(() => {
    if (!isOpen) return;
    let val = 15;
    let dir = 3;
    const gTimer = setInterval(() => {
      val += dir;
      if (val > 85 || val < 15) dir = -dir;
      setProgress(val);
    }, 30);
    return () => clearInterval(gTimer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-arena-600 bg-arena-950 shadow-2xl">
        {/* Barre titre */}
        <div className="flex items-center justify-between border-b border-arena-800 bg-arena-900 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-dunk-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-chalk">
              Démonstration Automatique : Workflow TrashDunk
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-chalk-dim transition hover:bg-arena-800 hover:text-chalk"
          >
            ✕
          </button>
        </div>

        {/* Étape indicateur */}
        <div className="grid grid-cols-4 border-b border-arena-800 bg-arena-900/50 text-center text-[11px] font-medium text-chalk-dim">
          <div className={`py-2 ${step === 0 || step === 1 ? "border-b-2 border-dunk-500 text-dunk-400 font-bold" : ""}`}>
            1. Clic droit Explorer
          </div>
          <div className={`py-2 ${step === 2 ? "border-b-2 border-dunk-500 text-dunk-400 font-bold" : ""}`}>
            2. Dunk It !
          </div>
          <div className={`py-2 ${step === 3 ? "border-b-2 border-dunk-500 text-dunk-400 font-bold" : ""}`}>
            3. Jauge & Tir
          </div>
          <div className={`py-2 ${step === 4 ? "border-b-2 border-dunk-500 text-dunk-400 font-bold" : ""}`}>
            4. Swish & Corbeille
          </div>
        </div>

        {/* Zone de prévisualisation animée */}
        <div className="relative h-[380px] w-full overflow-hidden bg-[#0c121e] p-6">
          {/* Étape 1 & 2 : Fichier Explorer et menu contextuel */}
          {(step === 0 || step === 1 || step === 2) && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative rounded-xl border border-arena-700 bg-arena-900/90 p-5 shadow-xl w-80">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-lg bg-blue-500/20 text-2xl">
                    📄
                  </div>
                  <div>
                    <div className="font-semibold text-chalk text-sm">budget_obsolete_2024.xlsx</div>
                    <div className="text-xs text-chalk-dim">3.4 Mo · Feuille de calcul</div>
                  </div>
                </div>

                {/* Curseur souris simulé */}
                <div
                  className="absolute pointer-events-none transition-all duration-700 ease-out z-30"
                  style={{
                    top: step === 0 ? "50%" : step === 1 ? "110px" : "150px",
                    left: step === 0 ? "80%" : "60px",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5">
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                  </svg>
                </div>

                {/* Menu contextuel Windows simulé */}
                {step >= 1 && (
                  <div className="absolute left-16 top-12 z-20 w-52 rounded-lg border border-arena-700 bg-arena-900 p-1.5 shadow-2xl text-[12px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2 py-1 text-chalk-dim/70">Ouvrir</div>
                    <div className="px-2 py-1 text-chalk-dim/70">Modifier</div>
                    <div className="my-1 border-t border-arena-800" />
                    <div
                      className={`flex items-center justify-between rounded px-2 py-1.5 font-bold transition-all ${
                        step === 2 ? "bg-dunk-500 text-white scale-[1.02]" : "text-dunk-400 hover:bg-arena-800"
                      }`}
                    >
                      <span>🏀 Dunk it</span>
                      <span className="text-[10px] opacity-75">Ctrl+Maj+D</span>
                    </div>
                    <div className="my-1 border-t border-arena-800" />
                    <div className="px-2 py-1 text-chalk-dim/70">Supprimer</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Étape 3 : Arrivée sur le parquet & Jauge */}
          {step === 3 && (
            <div className="relative flex flex-col items-center justify-between h-full py-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 rounded-full border border-dunk-500/40 bg-dunk-500/10 px-4 py-1.5">
                <span className="text-xl">🏀</span>
                <span className="text-xs font-semibold text-chalk">
                  Fichier chargé : <b className="text-dunk-400">budget_obsolete_2024.xlsx</b>
                </span>
              </div>

              {/* Panier et ballon */}
              <div className="relative w-full max-w-md h-36 flex items-center justify-between px-8">
                <div className="text-4xl animate-bounce">🏀</div>
                <div className="relative text-5xl">
                  🗑️
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-swish/20 px-1 text-[9px] font-bold text-swish border border-swish/40">
                    SWISH ZONE
                  </div>
                </div>
              </div>

              {/* Jauge */}
              <div className="w-80">
                <div className="mb-1 flex justify-between text-[11px] font-mono text-chalk-dim">
                  <span>AIR BALL</span>
                  <span className="text-swish font-bold">PARFAIT (≤ 2%)</span>
                  <span>BRICK</span>
                </div>
                <div className="relative h-6 w-full rounded-full border border-arena-700 bg-arena-900 overflow-hidden">
                  <div className="absolute left-[44%] right-[44%] top-0 bottom-0 bg-swish/30 border-x border-swish/80" />
                  <div
                    className="absolute top-0 bottom-0 w-2.5 rounded-full bg-white shadow-[0_0_10px_white]"
                    style={{ left: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 4 : Explosion Swish & Destination Corbeille */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in-90 duration-300">
              <div className="display text-6xl text-swish drop-shadow-[0_0_25px_rgba(67,227,155,0.8)]">
                SWISH !
              </div>
              <div className="mt-2 text-lg font-bold text-chalk">
                Fichier éliminé sans bavure !
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-swish/30 bg-swish/10 px-4 py-1.5 text-xs text-swish">
                <span>✓</span> Déplacé avec succès vers la Corbeille Windows native
              </div>
              <p className="mt-4 text-xs text-chalk-dim max-w-sm">
                Rien n'est détruit : si vous regrettez votre tir, vous pouvez toujours le restaurer depuis la corbeille.
              </p>
            </div>
          )}
        </div>

        {/* Pied du modal */}
        <div className="flex items-center justify-between border-t border-arena-800 bg-arena-900/80 px-6 py-3 text-xs text-chalk-dim">
          <span>Animation automatique continue</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-dunk-500 px-4 py-1.5 font-semibold text-white transition hover:bg-dunk-600"
          >
            Fermer et Essayer
          </button>
        </div>
      </div>
    </div>
  );
}
