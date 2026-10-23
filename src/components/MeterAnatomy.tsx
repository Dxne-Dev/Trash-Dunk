import { useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/audio";
import { Reveal, SectionHead } from "./Chrome";

type Tier = {
  id: string;
  max: number;
  label: string;
  color: string;
  verdict: string;
  pts: string;
  effect: string;
};

const TIERS: Tier[] = [
  {
    id: "swish",
    max: 2,
    label: "Swish",
    color: "#43e39b",
    verdict: "Le filet ne bouge même pas.",
    pts: "100 pts × combo × puissance",
    effect: "Trajectoire parfaite, le fichier passe direct dans la corbeille.",
  },
  {
    id: "bank",
    max: 8,
    label: "Panier avec rebond",
    color: "#f6c453",
    verdict: "Ça tape l'arceau, ça rentre.",
    pts: "60 pts × combo × puissance",
    effect: "Le ballon accroche le cercle puis tombe dedans. Fichier supprimé.",
  },
  {
    id: "rim",
    max: 15,
    label: "Rebond raté",
    color: "#ea5a24",
    verdict: "Pile ou face sur le cercle.",
    pts: "40 pts si ça rentre",
    effect: "50/50 aléatoire : le ballon ressort ou finit par tomber. Suspense.",
  },
  {
    id: "air",
    max: Infinity,
    label: "Air ball",
    color: "#ff4f5a",
    verdict: "Buzzer. Le public est méchant.",
    pts: "0 pt (streak remis à zéro)",
    effect: "Le fichier revient exactement à sa position initiale. Rien n'est perdu.",
  },
];

const tierOf = (delta: number) => TIERS.find((t) => delta <= t.max) ?? TIERS[3];

export function MeterAnatomy() {
  const [target, setTarget] = useState(62);
  const [value, setValue] = useState(48);
  const [hover, setHover] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const delta = Math.abs(value - target);
  const tier = tierOf(delta);

  const setFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const v = Math.round(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
    setValue((prev) => {
      if (prev !== v) sfx.play("ui");
      return v;
    });
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const mv = (e: PointerEvent) => setFromClientX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, setFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setValue((v) => Math.max(0, v - 1));
    else if (e.key === "ArrowRight") setValue((v) => Math.min(100, v + 1));
    else if (e.key === "Home") setValue(0);
    else if (e.key === "End") setValue(100);
    else return;
    e.preventDefault();
  };

  const band = (from: number, width: number, color: string, opacity: number, active: boolean) => (
    <div
      className="absolute inset-y-0 transition-all duration-300"
      style={{
        left: `${Math.max(0, from)}%`,
        width: `${Math.max(0, Math.min(100 - Math.max(0, from), width))}%`,
        background: color,
        opacity: hover && !active ? opacity * 0.35 : opacity,
        filter: active && hover ? "saturate(1.4) brightness(1.25)" : "none",
      }}
    />
  );

  return (
    <section id="geste" className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <SectionHead
          index="02"
          eyebrow="Un seul geste continu"
          accent="#f6c453"
          title={
            <>
              La jauge décide.
              <br />
              <span className="stroke-text">Votre timing aussi.</span>
            </>
          }
        >
          <p className="text-[15px] leading-relaxed text-chalk-dim">
            Appuyer, tirer vers le bas, relâcher. Le relâché fige l'aiguille <em className="text-chalk not-italic">et</em> déclenche
            le tir : pas de seconde action, pas de validation intermédiaire. Plus vous tirez fort, plus l'aiguille
            oscille vite, et plus le dunk rapporte de points.
          </p>
        </SectionHead>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ---------- mètre ---------- */}
        <Reveal className="rounded-2xl border border-arena-700/80 bg-arena-900/70 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.28em] text-chalk-dim/65 uppercase">Simulateur de relâché</div>
              <div className="display mt-1 text-[30px] leading-none text-chalk">Déplacez l'aiguille</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-chalk-dim/70">cible</span>
              <button
                onClick={() => { sfx.play("ui"); setTarget((t) => Math.max(6, t - 1)); }}
                className="grid h-7 w-7 place-items-center rounded border border-arena-600 bg-arena-850 text-chalk-dim transition hover:border-gold hover:text-gold"
                aria-label="Baisser la cible"
              >
                −
              </button>
              <span className="tnum display w-14 text-center text-[26px] leading-none text-swish">{target}%</span>
              <button
                onClick={() => { sfx.play("ui"); setTarget((t) => Math.min(94, t + 1)); }}
                className="grid h-7 w-7 place-items-center rounded border border-arena-600 bg-arena-850 text-chalk-dim transition hover:border-gold hover:text-gold"
                aria-label="Monter la cible"
              >
                +
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-label="Valeur de la jauge au relâché"
            onKeyDown={onKeyDown}
            onPointerDown={(e) => {
              sfx.unlock();
              setDragging(true);
              setFromClientX(e.clientX);
            }}
            className="relative mt-7 mb-9 h-14 cursor-ew-resize touch-none rounded-md border border-arena-600 bg-arena-950 outline-none focus-visible:ring-2 focus-visible:ring-dunk-500"
          >
            <div className="absolute inset-1 overflow-hidden rounded-[3px]">
              {band(target - 15, 30, "#ea5a24", 0.45, hover === "rim")}
              {band(target - 8, 16, "#f6c453", 0.65, hover === "bank")}
              {band(target - 2, 4, "#43e39b", 1, hover === "swish")}
              <div className="halftone absolute inset-0 opacity-20" />
              {Array.from({ length: 21 }, (_, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-chalk/10" style={{ left: `${i * 5}%` }} />
              ))}
            </div>

            {/* cible */}
            <div className="absolute inset-y-[-9px] w-[2px] bg-chalk" style={{ left: `${target}%`, boxShadow: "0 0 12px rgba(245,240,230,.9)" }}>
              <span className="tnum absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-chalk px-1.5 py-0.5 text-[10px] font-bold text-arena-950">
                {target}
              </span>
            </div>

            {/* aiguille */}
            <div
              className="absolute inset-y-[-13px] w-[5px] -translate-x-1/2 rounded-full transition-transform duration-75"
              style={{
                left: `${value}%`,
                background: tier.color,
                boxShadow: `0 0 18px 3px ${tier.color}99`,
                transform: `translateX(-50%) scaleY(${dragging ? 1.12 : 1})`,
              }}
            >
              <span
                className="tnum absolute -bottom-7 left-1/2 -translate-x-1/2 text-[13px] font-bold"
                style={{ color: tier.color }}
              >
                {value}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border p-4 transition-colors duration-300"
            style={{ borderColor: `${tier.color}55`, background: `${tier.color}0f` }}
          >
            <div className="min-w-[150px]">
              <div className="text-[10px] tracking-[0.22em] text-chalk-dim/70 uppercase">Écart avec la cible</div>
              <div className="tnum display text-[44px] leading-[0.8]" style={{ color: tier.color }}>
                {delta.toFixed(0)}
                <span className="text-[20px]">%</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="display text-[27px] leading-none" style={{ color: tier.color }}>
                {tier.label}
              </div>
              <div className="mt-1 text-[13px] text-chalk/85">{tier.verdict}</div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-chalk-dim">
                <span>
                  <b className="text-gold">{tier.pts}</b>
                </span>
                <span className="text-chalk-dim/80">{tier.effect}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11.5px] text-arena-500">
            Vitesse d'oscillation = (0,28 + 0,62 × puissance) × réglage de jauge, en cycles/s. En « Standard » à pleine
            puissance, l'aiguille balaie 100 % en 0,55 s : la fenêtre swish dure alors ~22 ms, la fenêtre panier ~89 ms.
          </p>
        </Reveal>

        {/* ---------- barème ---------- */}
        <Reveal delay={90} className="flex flex-col gap-3">
          {TIERS.map((t, i) => {
            const active = hover === t.id || tier.label === t.label;
            return (
              <button
                key={t.id}
                onMouseEnter={() => setHover(t.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(t.id)}
                onBlur={() => setHover(null)}
                onClick={() => {
                  sfx.play("ui");
                  setValue(t.max === Infinity ? Math.min(100, target + 26) : Math.max(0, target - Math.floor(t.max * 0.7)));
                }}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                  active ? "border-transparent" : "border-arena-700/80 bg-arena-900/50 hover:border-arena-600"
                }`}
                style={active ? { background: `${t.color}14`, borderColor: `${t.color}66` } : undefined}
              >
                <span
                  className="absolute inset-y-0 left-0 w-[3px] transition-all duration-300 group-hover:w-[5px]"
                  style={{ background: t.color }}
                />
                <div className="flex items-baseline gap-3 pl-3">
                  <span className="display text-[15px] tracking-widest" style={{ color: t.color }}>
                    {t.max === Infinity ? "> 15 %" : `≤ ${t.max} %`}
                  </span>
                  <span className="display text-[24px] leading-none text-chalk">{t.label}</span>
                  <span className="tnum ml-auto text-[11px] text-chalk-dim/60">0{i + 1}</span>
                </div>
                <p className="mt-2 pl-3 text-[13px] leading-relaxed text-chalk-dim">{t.effect}</p>
                <div
                  className="mt-3 h-1 overflow-hidden rounded-full bg-arena-800"
                  style={{ marginLeft: "12px" }}
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: t.max === Infinity ? "100%" : `${Math.min(100, (t.max / 15) * 100)}%`,
                      background: t.color,
                      opacity: active ? 1 : 0.5,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
