import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Arena } from "./arena/Arena";
import { InstallerModal } from "./InstallerModal";
import { DunkProvider } from "@/state/dunk";

export function DesktopOverlayMode() {
  const [status, setStatus] = useState<{ is_installed: boolean; is_onboarded: boolean } | null>(null);
  const [targetFiles, setTargetFiles] = useState<string[]>([]);
  const [showInstaller, setShowInstaller] = useState(false);
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);

  useEffect(() => {
    // Vérifier le statut de l'application
    invoke<{ is_installed: boolean; is_onboarded: boolean }>("get_app_status").then((st) => {
      setStatus(st);
      if (!st.is_installed) {
        setShowInstaller(true);
      }
    });

    // Charger les fichiers ciblés (soit via clic droit, soit via onboarding)
    invoke<string[]>("get_target_files").then((files) => {
      setTargetFiles(files);
    });

    // Touche Échap = quitter l'overlay immédiatement
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        invoke("close_overlay");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleShootSuccess = (file: string) => {
    invoke("send_to_recycle_bin", { path: file });

    // Si on est en phase d'onboarding, on valide l'étape
    if (status && !status.is_onboarded) {
      setOnboardingSuccess(true);
      invoke("complete_onboarding");
      setTimeout(() => {
        invoke("close_overlay");
      }, 2500);
    }
  };

  if (!status) return null;

  // 1. Première ouverture : Boîte d'installation des conditions
  if (showInstaller) {
    return (
      <InstallerModal
        onInstalled={() => {
          setShowInstaller(false);
          // Recharger les fichiers injectés
          invoke<string[]>("get_target_files").then((files) => {
            setTargetFiles(files);
          });
        }}
      />
    );
  }

  // 2. Mode Overlay 100% Transparent (Sans aucun fond de fenêtre !)
  return (
    <DunkProvider>
      <div className="relative h-screen w-screen bg-transparent text-chalk overflow-hidden select-none pointer-events-none">
        {/* Toast / Bannière d'échauffement flottante en haut */}
        {!status.is_onboarded && !onboardingSuccess && (
          <div className="pointer-events-auto absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full border border-dunk-500/80 bg-arena-950/95 px-6 py-2.5 shadow-2xl backdrop-blur-md">
            <span className="text-lg">🏀</span>
            <span className="text-xs font-semibold text-chalk">
              Échauffement : Dunker les fichiers temporaires pour finaliser l'installation !
            </span>
            <span className="text-[10px] text-chalk-dim bg-arena-850 px-2 py-0.5 rounded border border-arena-700">
              [Échap pour quitter]
            </span>
          </div>
        )}

        {/* Message de succès onboarding */}
        {onboardingSuccess && (
          <div className="pointer-events-auto absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center rounded-2xl border border-swish/60 bg-arena-950/95 px-8 py-5 shadow-2xl backdrop-blur-md animate-in zoom-in-95">
            <div className="display text-3xl text-swish">SWISH ! ÉCHAUFFEMENT TERMINÉ 🏆</div>
            <p className="mt-1 text-xs text-chalk-dim text-center">
              TrashDunk est maintenant actif en veille en arrière-plan. Faites clic droit sur n'importe quel fichier à l'avenir !
            </p>
          </div>
        )}

        {/* Les composants de jeu flottants au-dessus du vrai bureau */}
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full max-w-[1100px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)]">
            <Arena onFileDunked={handleShootSuccess} />
          </div>
        </div>
      </div>
    </DunkProvider>
  );
}
