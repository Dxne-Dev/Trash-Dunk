import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export function InstallerModal({ onInstalled }: { onInstalled: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInstall = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await invoke("install_service");
      onInstalled();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-arena-600 bg-arena-950 p-6 shadow-2xl text-chalk">
        {/* En-tête */}
        <div className="flex items-center gap-3 border-b border-arena-800 pb-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-dunk-500 text-xl font-bold">
            🏀
          </span>
          <div>
            <h1 className="display text-2xl font-bold leading-none text-chalk">
              Installation de Trash<span className="text-dunk-500">Dunk</span>
            </h1>
            <p className="text-xs text-chalk-dim mt-0.5">Utilitaire Windows de suppression sportive</p>
          </div>
        </div>

        {/* Conditions d'utilisation */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-chalk-dim uppercase tracking-wider block mb-1.5">
            Conditions d'utilisation & Sécurité
          </label>
          <div className="h-44 overflow-y-auto rounded-lg border border-arena-800 bg-arena-900/60 p-3 text-xs leading-relaxed text-chalk-dim space-y-2">
            <p>
              <b className="text-chalk">1. Protection des données :</b> TrashDunk n'écrase jamais la fonction Supprimer native de Windows. Un tir réussi déplace uniquement le fichier vers la corbeille standard.
            </p>
            <p>
              <b className="text-chalk">2. Annulation sécurisée :</b> Tout tir manqué ou l'appui sur la touche Échap laisse vos fichiers strictement intacts.
            </p>
            <p>
              <b className="text-chalk">3. Confidentialité :</b> Aucun fichier n'est téléversé, lu ou analysé. Aucune télémétrie n'est envoyée.
            </p>
            <p>
              <b className="text-chalk">4. Service d'arrière-plan :</b> TrashDunk s'exécute silencieusement dans la barre des tâches pour répondre instantanément au clic droit « Dunk it 🏀 ».
            </p>
          </div>
        </div>

        {/* Case à cocher */}
        <div className="mt-4 flex items-center gap-2.5">
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 rounded border-arena-600 bg-arena-850 text-dunk-500 focus:ring-dunk-500 cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-chalk cursor-pointer select-none">
            J'accepte les conditions et souhaite installer TrashDunk
          </label>
        </div>

        {/* Bouton d'action */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => invoke("close_overlay")}
            className="rounded-lg border border-arena-700 bg-arena-850 px-4 py-2 text-xs font-semibold text-chalk-dim hover:text-chalk transition"
          >
            Quitter
          </button>
          <button
            disabled={!agreed || loading}
            onClick={handleInstall}
            className="rounded-lg bg-dunk-500 px-6 py-2 text-xs font-bold text-white transition hover:bg-dunk-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? "Installation..." : "Installer & Démarrer l'échauffement 🏀"}
          </button>
        </div>
      </div>
    </div>
  );
}
