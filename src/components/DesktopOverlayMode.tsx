import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Arena } from "./arena/Arena";
import { DunkProvider } from "@/state/dunk";

export function DesktopOverlayMode() {
  const [targetFiles, setTargetFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les fichiers ciblés (passés en argument de ligne de commande via clic droit)
    invoke<string[]>("get_target_files")
      .then((files) => {
        setTargetFiles(files);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fermeture immédiate avec la touche Échap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        invoke("close_overlay");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleShootSuccess = (file: string) => {
    // Suppression réelle vers la corbeille native via Rust
    invoke("send_to_recycle_bin", { path: file });
  };

  if (loading) return null;

  return (
    <DunkProvider>
      <div className="relative h-screen w-screen bg-[#070b12]/92 text-chalk backdrop-blur-md overflow-hidden select-none flex flex-col justify-between p-6">
        {/* En-tête : Informations du fichier ciblé */}
        <div className="flex items-center justify-between border-b border-arena-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dunk-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-dunk-500" />
            </span>
            <span className="display text-xl text-chalk">
              Trash<span className="text-dunk-500">Dunk</span>
            </span>
            <span className="text-xs text-chalk-dim border-l border-arena-700 pl-3">
              {targetFiles.length > 0
                ? `${targetFiles.length} fichier(s) prêt(s) au shoot`
                : "Session d'entraînement (Onboarding)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-chalk-dim/70">[Échap pour annuler sans supprimer]</span>
            <button
              onClick={() => invoke("close_overlay")}
              className="rounded-md border border-arena-700 bg-arena-850 px-3 py-1 text-xs font-semibold text-chalk-dim hover:text-white hover:border-dunk-500 transition"
            >
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Terrain de basket en plein écran */}
        <div className="relative flex-1 flex items-center justify-center py-4">
          <div className="w-full max-w-[1100px]">
            <Arena onFileDunked={handleShootSuccess} />
          </div>
        </div>
      </div>
    </DunkProvider>
  );
}
