import { forwardRef } from "react";
import { extMeta, formatSize, type DunkFile } from "@/lib/files";

export type HoopColorMode = "normal" | "ice" | "sunset";

type Props = {
  file: DunkFile | null;
  radius: number;
  aiming?: boolean;
  colorMode?: HoopColorMode;
};

/** Ballon de basket + plaque d'identité du fichier (façon maillot NBA). */
export const Ball = forwardRef<HTMLDivElement, Props>(function Ball(
  { file, radius, aiming, colorMode = "normal" },
  ref
) {
  const d = radius * 2;
  const meta = file ? extMeta(file.ext) : null;
  const isIce = colorMode === "ice";

  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 will-change-transform"
      style={{ width: d, height: d, marginLeft: -radius, marginTop: -radius }}
    >
      {isIce && (
        <>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(111,211,255,.65) 0%, rgba(168,236,255,.22) 48%, transparent 72%)",
              filter: "blur(11px)",
              transform: "scale(2.05)",
              animation: "td-ice-pulse 1.3s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-[2.5px] border-sky-200/90"
            style={{ animation: "td-ice-pulse 1.3s ease-in-out infinite" }}
          />
        </>
      )}

      <svg viewBox="0 0 100 100" width={d} height={d} className="relative block drop-shadow-[0_10px_16px_rgba(0,0,0,.55)]">
        <defs>
          <radialGradient id="td-ball" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#ffa869" />
            <stop offset="42%" stopColor="#ef6528" />
            <stop offset="100%" stopColor="#a52f0d" />
          </radialGradient>
          <radialGradient id="td-ball-ice" cx="34%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#ebfcff" />
            <stop offset="42%" stopColor="#5ec8ff" />
            <stop offset="100%" stopColor="#14679e" />
          </radialGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="47"
          fill={isIce ? "url(#td-ball-ice)" : "url(#td-ball)"}
          style={{ transition: "fill .28s ease" }}
        />
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={isIce ? "#0b4166" : "#6d1e06"}
          strokeWidth="1.6"
          opacity="0.6"
          style={{ transition: "stroke .28s ease" }}
        />
        <g
          stroke={isIce ? "#0a3654" : "#3d1204"}
          strokeWidth="2.6"
          fill="none"
          opacity="0.85"
          strokeLinecap="round"
          style={{ transition: "stroke .28s ease" }}
        >
          <path d="M50 3 V97" />
          <path d="M3 50 H97" />
          <path d="M16 16 Q50 50 16 84" />
          <path d="M84 16 Q50 50 84 84" />
        </g>
        <ellipse
          cx="34"
          cy="28"
          rx="13"
          ry="8"
          fill="#fff"
          opacity={isIce ? 0.45 : 0.16}
          transform="rotate(-28 34 28)"
          style={{ transition: "opacity .28s ease" }}
        />
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={isIce ? "#d6f6ff" : aiming ? "#f6c453" : "transparent"}
          strokeWidth="3"
          style={{ transition: "stroke .18s ease" }}
        />
      </svg>

      {file && meta && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontFamily: "var(--font-display)", pointerEvents: "none" }}
        >
          <span
            className="font-black tracking-tight text-white/95"
            style={{ fontSize: Math.max(10, radius * 0.42), textShadow: "0 2px 5px rgba(0,0,0,.55)" }}
          >
            {meta.label}
          </span>
        </div>
      )}

      {file && meta && (
        <div
          key={file.id}
          className="anim-pop absolute left-1/2 flex max-w-[190px] -translate-x-1/2 items-center gap-1.5 rounded-[3px] border border-arena-600/80 bg-arena-950/92 px-2 py-1 shadow-[0_8px_20px_rgba(0,0,0,.55)]"
          style={{ bottom: d + 8, pointerEvents: "none" }}
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-[1px]" style={{ background: meta.bg }} />
          <span className="truncate text-[10px] leading-none font-medium text-chalk/90 sm:text-[11px]">
            {file.name}.{file.ext}
          </span>
          <span className="tnum ml-auto shrink-0 text-[9px] leading-none text-chalk-dim/70">
            {formatSize(file.sizeKb)}
          </span>
        </div>
      )}
    </div>
  );
});
