import { Arena } from "./arena/Arena";
import { Reveal } from "./Chrome";

const FACTS: Array<[string, string, string]> = [
  ["1", "geste", "Appui, traction vers le bas, relâche. Le relâché est à la fois le tir et la validation du timing."],
  ["0", "octet perdu", "Un dunk réussi envoie le fichier dans la corbeille Windows. Un air ball ne touche à rien."],
  ["2%", "de fenêtre", "L'écart maximal entre l'aiguille et la cible pour décrocher un swish parfait."],
];

export function Opener() {
  return (
    <section className="relative z-10 pt-7 md:pt-11">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end">
          <Reveal>
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-2 rounded-full border border-arena-600 bg-arena-900/80 px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.18em] text-chalk-dim uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dunk-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-dunk-500" />
                </span>
                Utilitaire Windows · C# / WPF
              </span>
              <span className="rounded-full border border-swish/45 bg-swish/10 px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.18em] text-swish uppercase">
                Démo jouable ici
              </span>
            </div>

            <h1 className="display text-[clamp(44px,7.9vw,108px)] leading-[0.79]">
              <span className="block text-chalk">Supprimer</span>
              <span className="block text-chalk">un fichier</span>
              <span className="block text-dunk-500" style={{ textShadow: "0 0 60px rgba(234,90,36,.35)" }}>
                devrait être
              </span>
              <span className="block stroke-text">un sport.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-chalk-dim sm:text-[16.5px]">
              <b className="font-semibold text-chalk">TrashDunk</b> accroche un verbe « Dunk it » au clic droit de
              l'Explorateur. Un overlay transparent se pose sur le bureau, votre fichier devient un ballon, et il
              faut le mettre au panier pour qu'il aille à la corbeille. Le terrain ci-dessous est la vraie mécanique
              du jeu — drag, jauge, relâche.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-chalk-dim/80">
              <a
                href="#dunker"
                className="group flex items-center gap-2 rounded-md border border-dunk-500/60 bg-dunk-500/10 px-3.5 py-2 font-semibold text-dunk-300 transition hover:bg-dunk-500/20 hover:text-chalk"
              >
                <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
                Jouer maintenant
              </a>
              <span className="flex items-center gap-2">
                <kbd className="rounded border border-arena-600 bg-arena-900 px-1.5 py-0.5 font-mono text-[10.5px]">Échap</kbd>
                annule la session, rien n'est supprimé
              </span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <dl className="divide-y divide-arena-800 border-y border-arena-800">
              {FACTS.map(([big, unit, text]) => (
                <div key={unit} className="group flex gap-4 py-4 transition-colors hover:bg-arena-900/50">
                  <div className="flex w-[92px] shrink-0 items-baseline gap-1">
                    <span className="display text-[46px] leading-[0.75] text-chalk transition-colors group-hover:text-dunk-400">
                      {big}
                    </span>
                    <span className="display text-[15px] leading-none text-dunk-500">{unit}</span>
                  </div>
                  <dd className="pt-1 text-[12.5px] leading-relaxed text-chalk-dim">{text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>

      <div className="mt-9 md:mt-12">
        <Arena />
      </div>
    </section>
  );
}
