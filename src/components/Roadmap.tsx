import { Reveal, SectionHead } from "./Chrome";

type Season = {
  code: string;
  name: string;
  sub: string;
  color: string;
  progress: number;
  status: string;
  offset: string;
  items: string[];
};

const SEASONS: Season[] = [
  {
    code: "V1",
    name: "Rookie",
    sub: "MVP — version 1 jouable",
    color: "#eec491",
    progress: 100,
    status: "Livré",
    offset: "",
    items: [
      "Menu contextuel « Dunk it »",
      "Overlay transparent, panier, un fichier à la fois",
      "Mini-jeu : drag + jauge oscillante + relâche",
      "Envoi réel vers la corbeille Windows en cas de réussite",
      "Son basique (swoosh / raté)",
    ],
  },
  {
    code: "V2",
    name: "All-Star",
    sub: "Confort et fun",
    color: "#ea5a24",
    progress: 82,
    status: "Jouable dans la démo",
    offset: "lg:mt-12",
    items: [
      "Multi-fichiers : plusieurs ballons enchaînés",
      "Score + streak/combo avec multiplicateur",
      "Historique et statistiques (total, meilleur streak)",
      "Confettis et flammes sur combo, façon NBA Jam",
      "Paramètres : vitesse de jauge, son, taille d'overlay",
    ],
  },
  {
    code: "V3",
    name: "Hall of Fame",
    sub: "Optionnel, plus ambitieux",
    color: "#6fd3ff",
    progress: 18,
    status: "Au tableau",
    offset: "lg:mt-24",
    items: [
      "Skins de ballons et de paniers déblocables",
      "Classement local « meilleur streak du mois »",
      "Hook clavier global : remplacer la touche Suppr",
      "Mode difficile : jauge liée à la taille du fichier",
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <SectionHead
          index="04"
          eyebrow="Trois saisons"
          accent="#eec491"
          title={
            <>
              La feuille
              <br />
              <span className="stroke-text">de match.</span>
            </>
          }
        >
          <p className="text-[15px] leading-relaxed text-chalk-dim">
            On ne sort pas un produit, on déroule une saison. Chaque version ajoute du confort sans jamais
            toucher à la règle d'or : un tir raté ne supprime rien.
          </p>
        </SectionHead>
      </Reveal>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {SEASONS.map((s, i) => (
          <Reveal key={s.code} delay={i * 110} className={s.offset}>
            <article
              className="group relative overflow-hidden rounded-2xl border border-arena-700/80 bg-arena-900/60 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:bg-arena-850/80"
              style={{ boxShadow: `inset 0 1px 0 ${s.color}22` }}
            >
              <div
                className="pointer-events-none absolute -top-6 -right-3 display text-[130px] leading-none opacity-[0.07] transition-all duration-500 group-hover:opacity-[0.14]"
                style={{ color: s.color }}
              >
                {s.code}
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                style={{ background: `linear-gradient(90deg,${s.color},transparent)` }}
              />

              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="display text-[13px] tracking-[0.24em]" style={{ color: s.color }}>
                    {s.code}
                  </span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[9.5px] font-bold tracking-[0.14em] uppercase"
                    style={{ borderColor: `${s.color}55`, color: s.color, background: `${s.color}12` }}
                  >
                    {s.status}
                  </span>
                </div>
                <h3 className="display mt-2 text-[44px] leading-[0.85] text-chalk">{s.name}</h3>
                <p className="mt-1 text-[13px] text-chalk-dim">{s.sub}</p>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] tracking-[0.16em] text-chalk-dim/70 uppercase">
                    <span>Progression</span>
                    <span className="tnum font-bold" style={{ color: s.color }}>
                      {s.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-arena-800">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${s.progress}%`, background: s.color, boxShadow: `0 0 14px ${s.color}88` }}
                    />
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-[13.5px] leading-snug text-chalk/85">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        className="mt-[2px] shrink-0"
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 12.5l5 5L20 6.5" />
                      </svg>
                      <span className="transition-colors group-hover:text-chalk">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
