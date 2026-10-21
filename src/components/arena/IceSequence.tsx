import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/audio";
import coldStickerUrl from "@/assets/cold_sticker.png";

/** Sticker exact fourni pour la célébration « COLD » (double swish). */
export const COLD_STICKER_SRC = coldStickerUrl;
type Stage = "idle" | "freeze" | "crack" | "shatter";

/** Lignes de fracture principales qui traversent toute la couche de glace. */
const CRACKS: Array<{ d: string; delay: number; w: number }> = [
  { d: "M500 280 L438 228 L352 198 L264 134 L162 96 L48 24", delay: 0, w: 3.4 },
  { d: "M500 280 L578 232 L662 178 L774 148 L882 76 L978 34", delay: 45, w: 3.4 },
  { d: "M500 280 L556 336 L648 378 L742 446 L868 486 L972 544", delay: 95, w: 3.2 },
  { d: "M500 280 L418 334 L334 398 L218 438 L118 504 L26 542", delay: 135, w: 3.2 },
  { d: "M500 280 L492 186 L518 112 L488 18", delay: 175, w: 2.6 },
  { d: "M500 280 L514 374 L484 456 L516 552", delay: 205, w: 2.6 },
  { d: "M500 280 L386 286 L278 262 L154 294 L12 276", delay: 235, w: 2.5 },
  { d: "M500 280 L618 286 L734 268 L856 302 L990 282", delay: 265, w: 2.5 },
  // ramifications secondaires
  { d: "M352 198 L312 126 L292 52", delay: 290, w: 1.8 },
  { d: "M662 178 L706 96 L738 22", delay: 315, w: 1.8 },
  { d: "M648 378 L692 468 L712 548", delay: 335, w: 1.8 },
  { d: "M334 398 L286 482 L262 552", delay: 355, w: 1.8 },
  { d: "M418 334 L344 338 L272 368", delay: 375, w: 1.5 },
  { d: "M578 232 L646 236 L712 212", delay: 395, w: 1.5 },
];

/** Éclats polygonaux qui explosent vers l'extérieur quand la glace cède. */
const SHARDS: Array<{ pts: string; sx: string; sy: string; sr: string; delay: number }> = [
  { pts: "500,280 438,228 492,186", sx: "-48px", sy: "-210px", sr: "-32deg", delay: 0 },
  { pts: "500,280 492,186 578,232", sx: "56px", sy: "-215px", sr: "28deg", delay: 15 },
  { pts: "500,280 578,232 618,286", sx: "230px", sy: "-92px", sr: "41deg", delay: 25 },
  { pts: "500,280 618,286 556,336", sx: "238px", sy: "88px", sr: "-36deg", delay: 10 },
  { pts: "500,280 556,336 514,374", sx: "72px", sy: "212px", sr: "34deg", delay: 30 },
  { pts: "500,280 514,374 418,334", sx: "-66px", sy: "216px", sr: "-29deg", delay: 20 },
  { pts: "500,280 418,334 386,286", sx: "-236px", sy: "96px", sr: "38deg", delay: 5 },
  { pts: "500,280 386,286 438,228", sx: "-228px", sy: "-88px", sr: "-44deg", delay: 18 },
  { pts: "352,198 264,134 312,126 438,228", sx: "-260px", sy: "-210px", sr: "-52deg", delay: 35 },
  { pts: "662,178 706,96 774,148 578,232", sx: "268px", sy: "-204px", sr: "48deg", delay: 40 },
  { pts: "648,378 742,446 692,468 556,336", sx: "264px", sy: "202px", sr: "-46deg", delay: 45 },
  { pts: "334,398 218,438 286,482 418,334", sx: "-262px", sy: "206px", sr: "50deg", delay: 38 },
  { pts: "162,96 48,24 264,134 154,294", sx: "-310px", sy: "-150px", sr: "-60deg", delay: 55 },
  { pts: "882,76 978,34 856,302 774,148", sx: "312px", sy: "-148px", sr: "58deg", delay: 50 },
];

type Props = {
  /** Incrémenté à chaque déclenchement (double swish). */
  triggerId: number;
  /** Appelé à l'instant exact de l'explosion pour projeter particules + secousse. */
  onShatter?: () => void;
};

export function IceSequence({ triggerId, onShatter }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const shatterCbRef = useRef(onShatter);
  shatterCbRef.current = onShatter;

  useEffect(() => {
    if (!triggerId) return;

    // 1. L'aire de jeu se recouvre de glace
    setStage("freeze");
    sfx.play("freeze");

    // 2. La couche de glace se craquelle
    const tCrack = window.setTimeout(() => {
      setStage("crack");
      sfx.play("crack");
    }, 680);

    // 3. Explosion en éclats + « COLD » + sticker
    const tShatter = window.setTimeout(() => {
      setStage("shatter");
      sfx.play("shatter");
      shatterCbRef.current?.();
    }, 1360);

    // 4. Fin de l'animation : le terrain redevient libre, le panier garde le bleu glace
    const tDone = window.setTimeout(() => {
      setStage("idle");
    }, 3150);

    return () => {
      window.clearTimeout(tCrack);
      window.clearTimeout(tShatter);
      window.clearTimeout(tDone);
    };
  }, [triggerId]);

  if (stage === "idle") return null;

  return (
    <div key={triggerId} className="pointer-events-none absolute inset-0 z-15 overflow-hidden select-none">
      {/* Phase 1 & 2 : couche visuelle de glace qui recouvre l'aire de jeu */}
      {(stage === "freeze" || stage === "crack") && (
        <div
          className="absolute inset-0"
          style={{
            animation: "td-frost-in .58s cubic-bezier(.16,1,.3,1) both",
            backdropFilter: "blur(2.4px) saturate(1.25)",
            WebkitBackdropFilter: "blur(2.4px) saturate(1.25)",
            background:
              "radial-gradient(circle at 50% 50%, rgba(165,232,255,.16) 0%, rgba(92,198,255,.32) 56%, rgba(28,118,186,.52) 100%)",
            boxShadow:
              "inset 0 0 110px 36px rgba(152,229,255,.55), inset 0 0 28px 6px rgba(255,255,255,.45)",
          }}
        >
          {/* Cristaux de givre dans les coins et sur les bords */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
            <defs>
              <linearGradient id="td-ice-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="48%" stopColor="#8fe2ff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#d9f7ff" stopOpacity="0.38" />
              </linearGradient>
            </defs>
            <rect width="1000" height="560" fill="url(#td-ice-sheen)" />
            {/* Givre cristallin aux 4 angles */}
            <g stroke="#e8fbff" strokeLinecap="round" fill="none" opacity="0.72">
              <path d="M0 0 L150 58 M62 24 L98 4 M96 38 L78 82 M0 0 L68 134 M34 66 L8 108" strokeWidth="2.2" />
              <path d="M1000 0 L848 62 M932 26 L896 6 M904 40 L922 86 M1000 0 L934 132" strokeWidth="2.2" />
              <path d="M0 560 L156 502 M72 534 L112 554 M102 522 L84 478 M0 560 L66 432" strokeWidth="2.2" />
              <path d="M1000 560 L846 498 M928 532 L890 554 M898 520 L918 476 M1000 560 L930 430" strokeWidth="2.2" />
            </g>
          </svg>
        </div>
      )}

      {/* Phase 2 : craquelures à travers toute la plaque de glace */}
      {stage === "crack" && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {CRACKS.map((c, i) => (
              <g key={i}>
                <path
                  d={c.d}
                  stroke="#5cd2ff"
                  strokeWidth={c.w * 2.4}
                  strokeOpacity="0.45"
                  strokeDasharray="620"
                  style={{
                    animation: `td-crack-draw 300ms ease-out ${c.delay}ms both`,
                  }}
                />
                <path
                  d={c.d}
                  stroke="#ffffff"
                  strokeWidth={c.w}
                  strokeDasharray="620"
                  style={{
                    animation: `td-crack-draw 300ms ease-out ${c.delay}ms both`,
                  }}
                />
              </g>
            ))}
          </g>
          <circle
            cx="500"
            cy="280"
            r="34"
            fill="#e8fcff"
            opacity="0.7"
            style={{ filter: "blur(14px)", animation: "td-ice-pulse .35s ease-in-out infinite" }}
          />
        </svg>
      )}

      {/* Phase 3 : explosion de la glace + mot « COLD » + sticker à côté */}
      {stage === "shatter" && (
        <>
          {/* Flash glacé instantané à l'impact */}
          <div
            className="absolute inset-0 bg-cyan-100/45"
            style={{ animation: "td-shard-fly .35s ease-out forwards" }}
          />

          {/* Éclats de glace projetés dans toutes les directions */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
            {SHARDS.map((s, i) => (
              <polygon
                key={i}
                points={s.pts}
                fill="rgba(182, 238, 255, 0.72)"
                stroke="#ffffff"
                strokeWidth="2"
                style={{
                  transformOrigin: "500px 280px",
                  ["--sx" as string]: s.sx,
                  ["--sy" as string]: s.sy,
                  ["--sr" as string]: s.sr,
                  animation: `td-shard-fly 920ms cubic-bezier(.12,.82,.24,1) ${s.delay}ms forwards`,
                }}
              />
            ))}
          </svg>

          {/* Mot « COLD » + sticker juste à côté */}
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="flex items-center gap-3.5 sm:gap-5">
              <div
                className="display relative text-[clamp(62px,11vw,118px)] leading-none tracking-[0.04em]"
                style={{
                  animation: "td-cold-slam 1.75s cubic-bezier(.16,1,.3,1) forwards",
                  backgroundImage: "linear-gradient(180deg, #ffffff 0%, #c8f3ff 46%, #59c6ff 78%, #1c7fb8 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextStroke: "2.5px rgba(8, 24, 44, 0.85)",
                  filter:
                    "drop-shadow(0 8px 0 rgba(7,22,42,.88)) drop-shadow(0 0 34px rgba(111,211,255,.95))",
                }}
              >
                COLD
              </div>

              <div
                className="relative shrink-0 rounded-xl border-[3.5px] border-white bg-white p-1"
                style={{
                  animation: "td-sticker-slap 1.75s cubic-bezier(.16,1,.3,1) 60ms forwards",
                  boxShadow:
                    "0 14px 30px rgba(0,0,0,.78), 0 0 32px rgba(111,211,255,.85)",
                }}
              >
                <img
                  src={COLD_STICKER_SRC}
                  alt="Sticker COLD"
                  className="block h-[72px] w-[90px] rounded-[8px] object-cover sm:h-[94px] sm:w-[116px]"
                  draggable={false}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2.5 -right-2.5 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-sky-500 text-[12px] text-white shadow-md"
                >
                  ❄️
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
