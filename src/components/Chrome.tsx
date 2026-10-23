import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDunk } from "@/state/dunk";

/* ------------------------------------------------------------------ */
/* Scroll reveal                                                       */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={{ ["--rd" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */
export function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <radialGradient id="mk-ball" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffa869" />
          <stop offset="55%" stopColor="#ef6528" />
          <stop offset="100%" stopColor="#a52f0d" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="13" r="9.5" fill="url(#mk-ball)" />
      <g stroke="#43150a" strokeWidth="1.3" opacity=".8">
        <path d="M20 3.5v19M10.5 13h19M13.6 6.3q6.4 6.7 0 13.4M26.4 6.3q-6.4 6.7 0 13.4" />
      </g>
      <path d="M8 25h24l-2.6 12.2H10.6z" fill="#1b2430" stroke="#6fd3ff" strokeOpacity=".55" strokeWidth="1.6" />
      <path d="M14 28.5l1 7.5M20 28.5v7.5M26 28.5l-1 7.5" stroke="#8fa6bd" strokeOpacity=".45" strokeWidth="1.4" />
      <path d="M6 25h28" stroke="#f5f0e6" strokeOpacity=".8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 22.5v2.5" stroke="#43e39b" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1.5 2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Barre de progression de lecture                                     */
/* ------------------------------------------------------------------ */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-transparent">
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-dunk-600 via-dunk-400 to-gold"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */
const LINKS: Array<[string, string]> = [
  ["#declenchement", "Déclenchement"],
  ["#geste", "Le geste"],
  ["#playbook", "Playbook"],
  ["#roadmap", "Roadmap"],
  ["#capot", "Sous le capot"],
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { soundOn, toggleSound, queue } = useDunk();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-arena-700/70 bg-arena-950/88 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-2.5 sm:px-6">
        <button onClick={() => go("#top")} className="group flex items-center gap-2.5">
          <span className="transition-transform duration-500 group-hover:rotate-[18deg]">
            <Mark />
          </span>
          <span className="display text-[24px] leading-none tracking-wide text-chalk">
            Trash<span className="text-dunk-500">Dunk</span>
          </span>
        </button>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {LINKS.map(([href, label]) => (
            <button
              key={href}
              onClick={() => go(href)}
              className="relative rounded-md px-3 py-2 text-[13px] font-medium text-chalk-dim transition hover:text-chalk"
            >
              <span className="relative z-10">{label}</span>
              <span className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-dunk-500 transition-transform duration-300 hover:scale-x-100" />
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={() => go("#dunker")}
              className="hidden items-center gap-1.5 rounded-md border border-arena-600 bg-arena-850 px-2.5 py-1.5 text-[11px] font-semibold text-chalk-dim transition hover:border-swish/60 hover:text-chalk sm:flex"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-swish opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-swish" />
              </span>
              <span className="tnum">{queue.length}</span> au tir
            </button>
          )}
          <button
            onClick={toggleSound}
            aria-label={soundOn ? "Couper le son" : "Activer le son"}
            className="grid h-9 w-9 place-items-center rounded-md border border-arena-600 bg-arena-850 text-chalk-dim transition hover:border-dunk-500 hover:text-chalk"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
              {soundOn ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9.5l5 5m0-5l-5 5" />}
            </svg>
          </button>
          <button
            onClick={() => go("#telecharger")}
            className="display rounded-md bg-dunk-500 px-4 py-2 text-[19px] leading-none tracking-wide text-white transition hover:bg-dunk-400 active:scale-95"
          >
            Télécharger
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-md border border-arena-600 bg-arena-850 text-chalk-dim lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-arena-700/70 bg-arena-950/95 px-4 py-2 lg:hidden">
          {LINKS.map(([href, label]) => (
            <button
              key={href}
              onClick={() => go(href)}
              className="block w-full border-b border-arena-800/70 py-3 text-left text-sm font-medium text-chalk-dim last:border-0 hover:text-dunk-400"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <ScrollProgress />
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Ruban LED d'arène                                                   */
/* ------------------------------------------------------------------ */
export function Ribbon({
  items,
  reverse,
  tone = "dark",
}: {
  items: string[];
  reverse?: boolean;
  tone?: "dark" | "orange";
}) {
  const row = [...items, ...items];
  return (
    <div
      className={`relative flex overflow-hidden border-y py-2 ${
        tone === "orange"
          ? "border-dunk-700/60 bg-dunk-600 text-white"
          : "border-arena-700/60 bg-arena-950/80 text-chalk-dim"
      }`}
    >
      <div className={`marquee-track ${reverse ? "rev" : ""}`}>
        {row.map((t, i) => (
          <span key={i} className="flex shrink-0 items-center gap-5 px-5">
            <span className="display text-[17px] leading-none tracking-[0.14em] whitespace-nowrap">{t}</span>
            <span className={`text-[10px] ${tone === "orange" ? "text-white/50" : "text-dunk-500/70"}`}>◆</span>
          </span>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-20"
        style={{ background: `linear-gradient(90deg,${tone === "orange" ? "#c33f16" : "#080a0f"},transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-20"
        style={{ background: `linear-gradient(270deg,${tone === "orange" ? "#c33f16" : "#080a0f"},transparent)` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* En-tête de section                                                  */
/* ------------------------------------------------------------------ */
export function SectionHead({
  index,
  eyebrow,
  title,
  accent,
  children,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:mb-11 md:flex-row md:items-end">
      <div className="flex items-start gap-4">
        <span
          className="display mt-1 shrink-0 text-[15px] leading-none tracking-[0.1em]"
          style={{ color: accent ?? "#ea5a24" }}
        >
          {index}
        </span>
        <div>
          <div className="mb-2 text-[10px] font-semibold tracking-[0.3em] text-chalk-dim/70 uppercase">{eyebrow}</div>
          <h2 className="display text-[clamp(38px,6vw,72px)] leading-[0.84] text-chalk">{title}</h2>
        </div>
      </div>
      {children && <div className="md:ml-auto md:max-w-sm md:pb-2">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toaster façon Windows 11                                            */
/* ------------------------------------------------------------------ */
export function Toaster() {
  const { toasts, dismissToast } = useDunk();
  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-[70] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2 sm:right-5 sm:bottom-5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-toast pointer-events-auto overflow-hidden rounded-lg border border-arena-600/80 bg-arena-850/97 shadow-[0_20px_50px_-12px_rgba(0,0,0,.85)] backdrop-blur-xl"
        >
          <div className="flex gap-3 p-3">
            <div className="mt-0.5 shrink-0">
              <Mark size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-chalk-dim">{t.app ?? "TrashDunk"}</span>
                <span className="text-[10px] text-arena-500">· maintenant</span>
                <button
                  onClick={() => dismissToast(t.id)}
                  className="ml-auto grid h-5 w-5 place-items-center rounded text-arena-500 transition hover:bg-arena-700 hover:text-chalk"
                  aria-label="Fermer"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="mt-0.5 flex items-start gap-2">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: t.tone === "success" ? "#43e39b" : t.tone === "warn" ? "#ff4f5a" : "#6fd3ff",
                  }}
                />
                <div className="min-w-0">
                  <div className="text-[13px] leading-tight font-semibold text-chalk">{t.title}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-chalk-dim">{t.body}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[3px] w-full bg-arena-700">
            <div
              className="h-full"
              style={{
                background: t.tone === "success" ? "#43e39b" : t.tone === "warn" ? "#ff4f5a" : "#6fd3ff",
                animation: "td-toast-bar 5.2s linear forwards",
              }}
            />
          </div>
        </div>
      ))}
      <style>{`@keyframes td-toast-bar{from{width:100%}to{width:0%}}`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pied de page                                                        */
/* ------------------------------------------------------------------ */
export function Footer() {
  return (
    <footer className="relative z-10 border-t border-arena-700/60 bg-arena-950/70">
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Mark size={30} />
              <span className="display text-[26px] leading-none text-chalk">
                Trash<span className="text-dunk-500">Dunk</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
              Un utilitaire Windows qui transforme la corbeille en raquette. Additif, jamais destructif :
              un tir réussi envoie le fichier dans la corbeille native, un tir raté ne touche à rien.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Tauri v2", "Rust", "React 19", "TypeScript", "Shell Extension"].map((t) => (
                <span key={t} className="rounded border border-arena-700 bg-arena-900 px-2 py-1 text-[10px] font-medium text-chalk-dim/85">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterCol
              title="Produit"
              links={[
                ["Le terrain", "#dunker"],
                ["Déclenchement", "#declenchement"],
                ["Le geste", "#geste"],
                ["Playbook", "#playbook"],
              ]}
            />
            <FooterCol
              title="Projet"
              links={[
                ["Roadmap", "#roadmap"],
                ["Sous le capot", "#capot"],
                ["Télécharger", "#telecharger"],
                ["Document de définition", "#capot"],
              ]}
            />
            <div>
              <div className="display mb-3 text-[13px] tracking-[0.22em] text-chalk/70 uppercase">Sécurité</div>
              <ul className="space-y-2 text-[13px] text-chalk-dim">
                <li className="flex gap-2">
                  <span className="text-swish">✓</span> Corbeille native, jamais de purge
                </li>
                <li className="flex gap-2">
                  <span className="text-swish">✓</span> Échap annule tout
                </li>
                <li className="flex gap-2">
                  <span className="text-swish">✓</span> Aucun upload, config locale
                </li>
                <li className="flex gap-2">
                  <span className="text-swish">✓</span> Désinstallation propre
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-arena-800 pt-6 text-[11px] text-arena-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} TrashDunk</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group ml-auto flex items-center gap-1.5 text-chalk-dim transition hover:text-dunk-400"
          >
            Retour au terrain
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:-translate-y-0.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div className="display mb-3 text-[13px] tracking-[0.22em] text-chalk/70 uppercase">{title}</div>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="group inline-flex items-center gap-1.5 text-[13px] text-chalk-dim transition hover:text-chalk"
            >
              <span className="h-px w-0 bg-dunk-500 transition-all duration-300 group-hover:w-3" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
