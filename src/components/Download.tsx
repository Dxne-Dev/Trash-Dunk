import { sfx } from "@/lib/audio";
import { useDunk } from "@/state/dunk";
import { Reveal } from "./Chrome";

const REQ: Array<[string, string]> = [
  ["Système", "Windows 10 / 11 · x64"],
  ["Runtime", "Aucun (Binaire natif Rust & WebView2)"],
  ["Poids", "8,9 Mo · hors ligne"],
  ["Permissions", "Aucune élévation requise"],
  ["Réseau", "Jamais. Zéro télémétrie."],
  ["Désinstallation", "Verbes shell retirés proprement"],
];

export function Download() {
  const { pushToast } = useDunk();

  const RELEASE_EXE_URL = "https://github.com/Dxne-Dev/Trash-Dunk/releases/latest/download/TrashDunk.exe";

  return (
    <section id="telecharger" className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 md:py-22">
      <Reveal>
        <div className="relative overflow-hidden rounded-[22px] border border-arena-700/80 bg-arena-900">
          {/* décor parquet + raquette */}
          <div className="hardwood absolute inset-0 opacity-[0.14]" aria-hidden />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 340" preserveAspectRatio="none" aria-hidden>
            <g fill="none" stroke="#f5f0e6" strokeOpacity="0.13" strokeWidth="2">
              <path d="M800 40 A 300 300 0 0 0 800 300" />
              <rect x="640" y="90" width="160" height="160" />
              <circle cx="800" cy="170" r="52" />
              <path d="M0 170h120" strokeDasharray="6 8" />
            </g>
          </svg>
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(80% 120% at 8% 0%, rgba(8,10,15,.35), rgba(8,10,15,.94) 68%)" }}
            aria-hidden
          />

          <div className="relative grid gap-9 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:p-12">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-swish/50 bg-swish/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-swish uppercase">
                  v1.0 · build 2026.02
                </span>
                <span className="rounded-full border border-arena-600 bg-arena-950/60 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-chalk-dim uppercase">
                  gratuit · open source
                </span>
              </div>

              <h2 className="display text-[clamp(44px,7.4vw,88px)] leading-[0.82] text-chalk">
                Installez-le.
                <br />
                <span className="text-dunk-500">Puis supprimez</span>
                <br />
                <span className="stroke-text">absolument tout.</span>
              </h2>

              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-chalk-dim">
                Un exécutable de 8 Mo qui ajoute un verbe au clic droit, pose un overlay transparent haute performance et ne parle jamais
                à Internet. La corbeille Windows reste la seule destination possible.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={RELEASE_EXE_URL}
                  onClick={() => {
                    sfx.play("drop");
                    pushToast({
                      app: "TrashDunk",
                      tone: "swish",
                      title: "Téléchargement lancé 🏀",
                      body: "L'exécutable TrashDunk.exe se télécharge. Bon shoot !",
                    });
                  }}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-lg bg-dunk-500 px-6 py-4 text-left transition hover:bg-dunk-400 active:scale-[.98]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
                  </svg>
                  <span>
                    <span className="display block text-[24px] leading-none text-white">Télécharger pour Windows</span>
                    <span className="block text-[11px] text-white/75">8,9 Mo · Exécutable Windows x64 (.exe)</span>
                  </span>
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-arena-700/80 bg-arena-950/70 p-5 backdrop-blur-sm">
              <div className="display mb-4 text-[15px] tracking-[0.22em] text-chalk-dim/80 uppercase">
                Configuration requise
              </div>
              <dl className="divide-y divide-arena-800/80">
                {REQ.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-[12px] text-chalk-dim/75">{k}</dt>
                    <dd className="text-right text-[12.5px] font-semibold text-chalk">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 rounded-lg border border-swish/30 bg-swish/[0.07] p-3.5">
                <div className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#43e39b" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="display text-[17px] leading-none text-swish">Règle d'or</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-chalk/85">
                  TrashDunk ne sait pas supprimer définitivement un fichier. Le seul chemin de sortie d'un dunk
                  réussi mène à la corbeille Windows, et la touche Échap annule la session sans altérer aucun fichier.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
