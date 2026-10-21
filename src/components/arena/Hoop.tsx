import { forwardRef } from "react";
import type { HoopColorMode } from "./Ball";

/** Panier de basket dessiné en SVG — repère : centre de l'arceau en (120,150) dans un viewBox 240x300. */
type Props = {
  width: number;
  left: number;
  top: number;
  lit?: boolean;
  netKey?: number;
  colorMode?: HoopColorMode;
};

const STRANDS = Array.from({ length: 11 }, (_, i) => (i / 10) * Math.PI * 2);

const netPoint = (theta: number, rx: number, ry: number, cy: number, twist = 0) => ({
  x: 120 + rx * Math.cos(theta + twist),
  y: cy + ry * Math.sin(theta + twist),
});

export const Hoop = forwardRef<SVGGElement, Props>(function Hoop(
  { width, left, top, lit, netKey, colorMode = "normal" },
  netRef
) {
  const isIce = colorMode === "ice";
  const isSunset = colorMode === "sunset";

  const glow = isIce
    ? "drop-shadow(0 0 32px rgba(94,200,255,.92)) drop-shadow(0 0 14px rgba(214,246,255,.65))"
    : isSunset
      ? undefined
      : lit
        ? "drop-shadow(0 0 26px rgba(67,227,155,.55))"
        : "drop-shadow(0 18px 26px rgba(0,0,0,.5))";

  const rimStroke = isIce
    ? "url(#td-rim-ice)"
    : isSunset
      ? "url(#td-rim-sunset)"
      : "url(#td-rim)";

  const boardStroke = isIce
    ? "#9fe6ff"
    : isSunset
      ? "url(#td-rim-sunset)"
      : "#f5f0e6";

  const netStroke = isIce
    ? "#bfefff"
    : isSunset
      ? "url(#td-net-sunset)"
      : "#f5f0e6";

  const stemStroke = isIce ? "#2780b8" : isSunset ? "#ff4db8" : "#c33f16";

  return (
    <svg
      viewBox="0 0 240 300"
      width={width}
      height={width * 1.25}
      className={isSunset ? "hoop-sunset" : undefined}
      style={{
        position: "absolute",
        left,
        top,
        overflow: "visible",
        pointerEvents: "none",
        filter: glow,
        transition: "filter .3s ease",
      }}
    >
      <defs>
        <linearGradient id="td-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7f3e8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#cfe3ee" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="td-board-ice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dff8ff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#4dbfff" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="td-board-sunset" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2438" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#ff4db8" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#ff8a1f" stopOpacity="0.28" />
        </linearGradient>

        {/* Arceau normal */}
        <linearGradient id="td-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8443" />
          <stop offset="55%" stopColor="#ea5a24" />
          <stop offset="100%" stopColor="#9d3110" />
        </linearGradient>

        {/* Arceau bleu glace (2 swishs) */}
        <linearGradient id="td-rim-ice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ebfcff" />
          <stop offset="50%" stopColor="#5ec8ff" />
          <stop offset="100%" stopColor="#146ca6" />
        </linearGradient>

        {/* Arceau + panneau gradient Rouge -> Rose -> Orange (3 tirs entrants consécutifs) */}
        <linearGradient id="td-rim-sunset" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff2438">
            <animate
              attributeName="stop-color"
              values="#ff2438;#ff4db8;#ff8a1f;#ff2438"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#ff4db8">
            <animate
              attributeName="stop-color"
              values="#ff4db8;#ff8a1f;#ff2438;#ff4db8"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#ff8a1f">
            <animate
              attributeName="stop-color"
              values="#ff8a1f;#ff2438;#ff4db8;#ff8a1f"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <linearGradient id="td-net-sunset" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff3b56" />
          <stop offset="52%" stopColor="#ff6ec7" />
          <stop offset="100%" stopColor="#ffb066" />
        </linearGradient>
      </defs>

      {/* Halo diffus Rouge / Rose / Orange derrière le panier quand actif */}
      {isSunset && (
        <ellipse
          cx="120"
          cy="142"
          rx="86"
          ry="68"
          fill="url(#td-rim-sunset)"
          opacity="0.3"
          style={{ filter: "blur(22px)" }}
        />
      )}

      {/* Halo diffus Bleu Glace derrière le panier quand actif */}
      {isIce && (
        <ellipse
          cx="120"
          cy="142"
          rx="82"
          ry="64"
          fill="#5ec8ff"
          opacity="0.28"
          style={{ filter: "blur(22px)" }}
        />
      )}

      {/* supports muraux */}
      <g stroke="#3a4655" strokeWidth="7" strokeLinecap="round">
        <path d="M104 56 L104 -60" />
        <path d="M136 56 L136 -60" />
      </g>
      <path d="M96 40 L144 40" stroke="#4a5a6b" strokeWidth="6" strokeLinecap="round" />

      {/* panneau */}
      <rect
        x="52"
        y="52"
        width="136"
        height="86"
        rx="7"
        fill={isIce ? "url(#td-board-ice)" : isSunset ? "url(#td-board-sunset)" : "url(#td-board)"}
        stroke={boardStroke}
        strokeOpacity={isIce || isSunset ? "0.95" : "0.72"}
        strokeWidth="4"
      />
      <rect
        x="90"
        y="94"
        width="60"
        height="44"
        rx="3"
        fill="none"
        stroke={boardStroke}
        strokeOpacity={isIce || isSunset ? "0.9" : "0.6"}
        strokeWidth="3.4"
      />
      <path
        d="M112 70 h16 M112 78 h16"
        stroke={isIce ? "#6fd3ff" : isSunset ? "#ff4db8" : "#ea5a24"}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* filet */}
      <g
        ref={netRef}
        key={netKey}
        className="anim-net"
        style={{ transformBox: "fill-box", transformOrigin: "top center", transition: "stroke .3s ease" }}
        stroke={netStroke}
        fill="none"
        strokeLinecap="round"
      >
        {STRANDS.map((t, i) => {
          const a = netPoint(t, 33, 9.5, 150);
          const b = netPoint(t, 17, 5, 208, 0.42);
          const back = Math.sin(t) < 0;
          return (
            <path
              key={`s${i}`}
              d={`M${a.x} ${a.y} Q ${(a.x + b.x) / 2 + (back ? -3 : 3)} ${(a.y + b.y) / 2} ${b.x} ${b.y}`}
              strokeWidth={back ? 1.3 : 2.1}
              strokeOpacity={back ? 0.35 : 0.88}
            />
          );
        })}
        {[168, 184, 198].map((y, i) => {
          const rx = 30 - i * 4.6;
          const ry = 8.4 - i * 1.2;
          return (
            <ellipse
              key={`r${i}`}
              cx="120"
              cy={y}
              rx={rx}
              ry={ry}
              strokeWidth={1.5}
              strokeOpacity={0.45 - i * 0.07}
            />
          );
        })}
      </g>

      {/* arceau */}
      <path
        d="M114 138 L114 150 M126 138 L126 150"
        stroke={stemStroke}
        strokeWidth="5"
        style={{ transition: "stroke .3s ease" }}
      />
      <ellipse
        cx="120"
        cy="150"
        rx="34"
        ry="10"
        fill="none"
        stroke={rimStroke}
        strokeWidth={lit || isIce || isSunset ? 8 : 6.5}
        style={{ transition: "stroke-width .2s ease" }}
      />
      <ellipse
        cx="120"
        cy="150"
        rx="34"
        ry="10"
        fill="none"
        stroke={isIce ? "#ffffff" : isSunset ? "#ffd9ec" : "#ffd7bd"}
        strokeWidth="1.2"
        opacity="0.55"
        style={{ transition: "stroke .3s ease" }}
      />

      {/* repère au sol sous l'arceau */}
      <g opacity="0.3" stroke="#f5f0e6" strokeWidth="1.4">
        <path d="M120 232 v16" strokeDasharray="3 5" />
      </g>
    </svg>
  );
});
