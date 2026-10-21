import { sfx } from "@/lib/audio";
import { useDunk } from "@/state/dunk";
import { ExplorerDemo } from "./ExplorerDemo";
import { Reveal, SectionHead } from "./Chrome";

const POINTS: Array<[string, string, string]> = [
  [
    "Additif, jamais substitué",
    "Le verbe « Dunk it » s'ajoute en bas du menu contextuel. « Supprimer » reste exactement où Windows l'a mis — de quoi rassurer tout le monde à la maison comme au bureau.",
    "#43e39b",
  ],
  [
    "Sélection multiple",
    "Ctrl+clic ou Maj+clic, puis clic droit : chaque fichier sélectionné devient un ballon, enchaîné dans une seule session avec combo et multiplicateur.",
    "#f6c453",
  ],
  [
    "Raccourci clavier",
    "Ctrl + Maj + D déclenche le même verbe sans quitter le clavier. La v3 prévoit un hook global pour remplacer la touche Suppr elle-même.",
    "#6fd3ff",
  ],
];

export function Trigger() {
  const { addFiles, pushToast } = useDunk();

  return (
    <section id="declenchement" className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <SectionHead
          index="01"
          eyebrow="Déclenchement"
          accent="#43e39b"
          title={
            <>
              Le clic droit
              <br />
              <span className="stroke-text">qui change tout.</span>
            </>
          }
        >
          <p className="text-[15px] leading-relaxed text-chalk-dim">
            Tout part d'un verbe shell enregistré dans <code className="font-mono text-[13px] text-ice">HKEY_CLASSES_ROOT</code>.
            Trois clés, un exécutable, et l'Explorateur gagne un nouveau geste.
          </p>
        </SectionHead>
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-8">
        <Reveal className="flex flex-col gap-3">
          {POINTS.map(([title, text, color], i) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-xl border border-arena-700/80 bg-arena-900/55 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-arena-500"
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px] transition-all duration-300 group-hover:w-[5px]"
                style={{ background: color }}
              />
              <div className="flex items-baseline gap-3 pl-3">
                <span className="tnum display text-[15px]" style={{ color }}>
                  0{i + 1}
                </span>
                <h3 className="display text-[25px] leading-none text-chalk">{title}</h3>
              </div>
              <p className="mt-2.5 pl-3 text-[13.5px] leading-relaxed text-chalk-dim">{text}</p>
            </div>
          ))}

          <div className="rounded-xl border border-dashed border-arena-600 bg-arena-950/50 p-5">
            <div className="display mb-2 text-[13px] tracking-[0.22em] text-chalk-dim/70 uppercase">
              Essayez pour de vrai
            </div>
            <p className="text-[13px] leading-relaxed text-chalk-dim">
              Faites un <b className="text-chalk">clic droit</b> sur une ligne de l'explorateur, choisissez
              <b className="text-dunk-400"> « Dunk it »</b> : le fichier part directement dans la file du terrain
              ci-dessus. Sélection multiple avec <kbd className="rounded border border-arena-600 bg-arena-900 px-1 font-mono text-[10.5px]">Ctrl</kbd>{" "}
              ou <kbd className="rounded border border-arena-600 bg-arena-900 px-1 font-mono text-[10.5px]">Maj</kbd>.
            </p>
            <button
              onClick={() => {
                sfx.play("grab");
                addFiles([
                  { id: `demo-${Date.now()}`, name: "dossier_photos_2019_à_trier", ext: "zip", sizeKb: 742100 },
                  { id: `demo2-${Date.now()}`, name: "note_frais_kilométriques", ext: "xlsx", sizeKb: 88 },
                ]);
                pushToast({
                  app: "TrashDunk",
                  tone: "info",
                  title: "2 fichiers envoyés au terrain",
                  body: "Chaîne de dunks démarrée — un ballon par fichier.",
                });
                document.querySelector("#dunker")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="display mt-4 rounded-lg bg-dunk-500 px-4 py-2.5 text-[20px] leading-none tracking-wide text-white transition hover:bg-dunk-400 active:scale-95"
            >
              🏀 Envoyer 2 fichiers
            </button>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <ExplorerDemo />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-[11.5px] text-chalk-dim/70">
            <span>Maquette d'Explorateur — le clic droit est fonctionnel.</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-dunk-500" />
              verbe enregistré par l'installeur
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
