import { Reveal, SectionHead } from "./Chrome";

type Step = {
  n: string;
  title: string;
  text: string;
  tag: string;
  Diagram: () => React.ReactElement;
};

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const STEPS: Step[] = [
  {
    n: "01",
    tag: "Shell",
    title: "Clic droit → « Dunk it »",
    text: "Un verbe shell personnalisé s'ajoute au menu contextuel de l'Explorateur, à côté du Supprimer natif. Il accepte la sélection multiple.",
    Diagram: () => (
      <svg viewBox="0 0 120 74" className="h-[74px] w-full">
        <rect x="6" y="6" width="60" height="62" rx="3" className="text-arena-600" {...line} />
        {[16, 28, 40, 52].map((y, i) => (
          <rect key={y} x="13" y={y} width={i === 2 ? 34 : 46} height="6" rx="1.5" className={i === 2 ? "text-dunk-500" : "text-arena-500"} fill="currentColor" opacity={i === 2 ? 0.9 : 0.35} />
        ))}
        <rect x="46" y="24" width="62" height="44" rx="4" className="text-chalk-dim" {...line} />
        <rect x="52" y="40" width="50" height="10" rx="2" className="text-dunk-500" fill="currentColor" opacity="0.25" />
        <circle cx="57" cy="45" r="3" className="text-dunk-400" fill="currentColor" />
        <path d="M62 45h34" className="text-dunk-300" {...line} strokeWidth={2} />
        <path d="M46 24l-6-5 1-8 5 4z" className="text-chalk" fill="currentColor" />
      </svg>
    ),
  },
  {
    n: "02",
    tag: "Overlay",
    title: "Fenêtre transparente, toujours dessus",
    text: "Une fenêtre WPF plein écran, Topmost, fond transparent : le bureau reste visible pendant que le terrain se pose par-dessus.",
    Diagram: () => (
      <svg viewBox="0 0 120 74" className="h-[74px] w-full">
        <rect x="8" y="8" width="104" height="58" rx="3" className="text-arena-600" {...line} />
        <rect x="8" y="8" width="104" height="9" rx="3" className="text-arena-500" fill="currentColor" opacity="0.3" />
        {[18, 30, 42].map((x) => (
          <rect key={x} x={x} y="24" width="14" height="11" rx="1.5" className="text-arena-500" {...line} opacity="0.6" />
        ))}
        <rect x="20" y="18" width="80" height="42" rx="2" className="text-swish" {...line} strokeDasharray="4 3" opacity="0.75" />
        <path d="M92 52v-8M92 44l-3 3M92 44l3 3" className="text-swish" {...line} />
        <text x="26" y="34" className="text-swish" fill="currentColor" fontSize="8" fontFamily="monospace">TOPMOST</text>
      </svg>
    ),
  },
  {
    n: "03",
    tag: "Mise en place",
    title: "Les fichiers deviennent des ballons",
    text: "Chaque fichier sélectionné apparaît sous forme de ballon étiqueté à son nom. Le panier se place à position fixe, la cible s'affiche au-dessus.",
    Diagram: () => (
      <svg viewBox="0 0 120 74" className="h-[74px] w-full">
        <rect x="78" y="10" width="30" height="20" rx="2" className="text-chalk-dim" {...line} />
        <ellipse cx="93" cy="34" rx="12" ry="4" className="text-dunk-500" {...line} strokeWidth={2.4} />
        <path d="M84 36l3 12h12l3-12" className="text-chalk-dim" {...line} opacity="0.55" />
        <text x="72" y="8" className="text-swish" fill="currentColor" fontSize="9" fontFamily="monospace" fontWeight="700">68%</text>
        {[
          [20, 52, "#ef6528"],
          [42, 60, "#ef6528"],
          [62, 50, "#ef6528"],
        ].map(([x, y, c], i) => (
          <g key={i}>
            <circle cx={x as number} cy={y as number} r="9" fill={c as string} />
            <path d={`M${(x as number) - 9} ${y}h18M${x} ${(y as number) - 9}v18`} stroke="#43150a" strokeWidth="1.2" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    n: "04",
    tag: "Le geste",
    title: "Tirer, viser, relâcher",
    text: "Le drag vers le bas tend l'élastique et réveille la jauge, qui oscille de plus en plus vite. Relâcher fige l'aiguille et propulse le ballon.",
    Diagram: () => (
      <svg viewBox="0 0 120 74" className="h-[74px] w-full">
        <circle cx="30" cy="30" r="11" className="text-dunk-500" fill="currentColor" />
        <path d="M19 30h22M30 19v22" stroke="#43150a" strokeWidth="1.3" />
        <path d="M30 45v16M25 55l5 6 5-6" className="text-gold" {...line} strokeWidth={2} />
        <rect x="52" y="48" width="60" height="9" rx="2" className="text-arena-600" {...line} />
        <rect x="76" y="48" width="8" height="9" className="text-swish" fill="currentColor" />
        <path d="M86 44v17" className="text-chalk" {...line} strokeWidth={2.2} />
        <path d="M52 42h60" className="text-arena-500" {...line} strokeDasharray="2 3" />
      </svg>
    ),
  },
  {
    n: "05",
    tag: "Résolution",
    title: "Corbeille réelle, ou rien du tout",
    text: "Panier validé : le fichier part dans la corbeille Windows — jamais de suppression définitive. Air ball : il reste en place et vous retentez.",
    Diagram: () => (
      <svg viewBox="0 0 120 74" className="h-[74px] w-full">
        <path d="M12 26q22-16 40 4" className="text-chalk-dim" {...line} strokeDasharray="3 4" opacity="0.7" />
        <circle cx="54" cy="32" r="9" className="text-dunk-500" fill="currentColor" />
        <path d="M78 40h24l-3 26H81z" className="text-ice" {...line} />
        <path d="M74 40h32" className="text-ice" {...line} strokeWidth={2.4} />
        <path d="M84 48v12M90 48v12M96 48v12" className="text-ice" {...line} opacity="0.4" />
        <path d="M83 54l5 5 9-11" className="text-swish" {...line} strokeWidth={2.6} />
      </svg>
    ),
  },
  {
    n: "06",
    tag: "Fin de session",
    title: "L'overlay se referme, le toast tombe",
    text: "La fenêtre disparaît et une notification Windows récapitule : score, meilleur streak, nombre de fichiers dunkés. Échap annule tout avant ça.",
    Diagram: () => (
      <svg viewBox="0 0 120 74" className="h-[74px] w-full">
        <rect x="30" y="16" width="62" height="34" rx="4" className="text-chalk-dim" {...line} />
        <circle cx="42" cy="28" r="5" className="text-dunk-500" fill="currentColor" />
        <path d="M52 25h32M52 32h22" className="text-chalk-dim" {...line} />
        <path d="M52 41h26" className="text-swish" {...line} strokeWidth={2} />
        <path d="M86 44h-4" className="text-arena-500" {...line} />
        <path d="M20 58h72" className="text-arena-600" {...line} strokeDasharray="2 4" />
        <text x="20" y="70" className="text-arena-500" fill="currentColor" fontSize="7.5" fontFamily="monospace">session closed · 0 file lost</text>
      </svg>
    ),
  },
];

export function Playbook() {
  return (
    <section id="playbook" className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <SectionHead
          index="03"
          eyebrow="Flow utilisateur"
          accent="#6fd3ff"
          title={
            <>
              Six actions,
              <br />
              <span className="stroke-text">zéro friction.</span>
            </>
          }
        >
          <p className="text-[15px] leading-relaxed text-chalk-dim">
            Du clic droit dans l'Explorateur jusqu'au toast de fin de session, tout tient en un geste continu.
            Le parcours est additif : Supprimer reste là où il a toujours été.
          </p>
        </SectionHead>
      </Reveal>

      <ol className="relative">
        <div
          className="absolute top-2 bottom-2 left-[19px] w-px md:left-1/2"
          style={{ background: "linear-gradient(180deg,transparent,#ea5a24 6%,#43e39b 50%,#6fd3ff 94%,transparent)" }}
          aria-hidden
        />
        {STEPS.map((s, i) => {
          const right = i % 2 === 1;
          return (
            <li key={s.n} className={`relative mb-6 pl-12 md:mb-10 md:w-1/2 md:pl-0 ${right ? "md:ml-auto md:pl-12" : "md:pr-12"}`}>
              <span
                className={`absolute top-6 grid h-[38px] w-[38px] place-items-center rounded-full border-2 bg-arena-950 md:top-8 ${
                  right ? "left-0 md:-left-[19px]" : "left-0 md:-right-[19px] md:left-auto"
                }`}
                style={{ borderColor: i % 3 === 0 ? "#ea5a24" : i % 3 === 1 ? "#43e39b" : "#6fd3ff" }}
                aria-hidden
              >
                <span className="display text-[17px] leading-none text-chalk">{s.n}</span>
              </span>

              <Reveal delay={i * 60}>
                <div className="group relative overflow-hidden rounded-xl border border-arena-700/80 bg-arena-900/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-arena-500 hover:bg-arena-850/80">
                  <div className="pointer-events-none absolute -top-10 -right-6 display text-[92px] leading-none text-chalk/[0.045] transition-all duration-500 group-hover:text-chalk/[0.09]">
                    {s.n}
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded border border-arena-600 bg-arena-950 px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.16em] text-chalk-dim uppercase">
                      {s.tag}
                    </span>
                  </div>
                  <div className="mb-3 rounded-lg border border-arena-700/60 bg-arena-950/70 p-2 text-chalk-dim">
                    <s.Diagram />
                  </div>
                  <h3 className="display text-[26px] leading-[0.95] text-chalk">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-chalk-dim">{s.text}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
