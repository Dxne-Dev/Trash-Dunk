import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { sfx } from "@/lib/audio";
import { extMeta } from "@/lib/files";
import type { DunkFile } from "@/lib/files";
import {
  BASE_POINTS,
  RESULT_LABEL,
  comboMultiplier,
  useDunk,
  type ResultKind,
  type ShotOutcome,
} from "@/state/dunk";
import { Ball, type HoopColorMode } from "./Ball";
import { Hoop } from "./Hoop";
import { IceSequence } from "./IceSequence";
import { ParticleField } from "./particles";

type V = { x: number; y: number };
type Phase = "idle" | "aim" | "flight" | "return";

type Seg = {
  p0: V;
  c: V;
  p1: V;
  dur: number;
  spin: number;
  s1?: number;
  onEnd?: () => void;
};

const REST = { x: 0.225, y: 0.685 };
const RIM = { x: 0.775, y: 0.345 };
const BINP = { x: 0.885, y: 0.815 };
const FLOOR = 0.905;
const MIN_POWER = 0.14;

const CONFETTI = ["#43e39b", "#f6c453", "#ea5a24", "#f5f0e6", "#6fd3ff"];

/** Réglage utilisateur : vitesse de base de la jauge (V2). */
const DIFF = {
  detente: { label: "Détente", k: 0.68, note: "Aiguille lente, pardon généreux." },
  standard: { label: "Standard", k: 1, note: "Réglage par défaut du document de définition." },
  nba: { label: "NBA", k: 1.45, note: "Aiguille rapide + vitesse liée à la taille du fichier : les gros .iso se dunkent difficilement." },
} as const;

type GameState = {
  phase: Phase;
  ball: V;
  rot: number;
  scale: number;
  origin: V;
  drag: V;
  power: number;
  gauge: number;
  gphase: number;
  flight: { segs: Seg[]; i: number; t: number } | null;
  outcome: ShotOutcome | null;
  ret: { from: V; t: number; dur: number; s0: number } | null;
  shake: number;
  bob: number;
  gpos: V;
  frozenPower: number;
};

function computeGeom(w: number, h: number) {
  const ballR = Math.max(19, Math.min(40, Math.min(w, h) * 0.058));
  const hoopW = Math.max(132, Math.min(232, w * 0.235));
  const rim = { x: RIM.x * w, y: RIM.y * h };
  return {
    w,
    h,
    ballR,
    hoopW,
    rim,
    rest: { x: REST.x * w, y: REST.y * h },
    bin: { x: BINP.x * w, y: BINP.y * h },
    floorY: FLOOR * h,
    maxPull: Math.min(h * 0.24, w * 0.22),
    hoopLeft: rim.x - hoopW / 2,
    hoopTop: rim.y - hoopW * 0.625,
    rimR: hoopW * (34 / 240),
    gaugeW: Math.max(170, Math.min(340, w * 0.4)),
  };
}

type Geom = ReturnType<typeof computeGeom>;

const qbez = (s: Seg, t: number): V => {
  const u = 1 - t;
  return {
    x: u * u * s.p0.x + 2 * u * t * s.c.x + t * t * s.p1.x,
    y: u * u * s.p0.y + 2 * u * t * s.c.y + t * t * s.p1.y,
  };
};

const arcCtl = (p0: V, p1: V, peakY: number, bias = 0.5): V => ({
  x: p0.x + (p1.x - p0.x) * bias,
  y: (4 * peakY - p0.y - p1.y) / 2,
});

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function Arena({
  onFileDunked,
  transparent = false,
}: {
  onFileDunked?: (file: string) => void;
  transparent?: boolean;
}) {
  const d = useDunk();
  const {
    queue,
    trashed,
    skipped,
    score,
    streak,
    shots,
    swishes,
    airballs,
    persisted,
    summary,
    soundOn,
    pulse,
  } = d;

  const [dims, setDims] = useState({ w: 960, h: 540 });
  const [shownFile, setShownFile] = useState<DunkFile | null>(queue[0] ?? null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [target, setTarget] = useState(() => 34 + Math.floor(Math.random() * 46));
  const [banner, setBanner] = useState<{
    kind: ResultKind;
    delta: number;
    pts: number;
    id: number;
    weak?: boolean;
  } | null>(null);
  const [hint, setHint] = useState(true);
  const [netKey, setNetKey] = useState(0);
  const [lit, setLit] = useState(false);
  const [binKick, setBinKick] = useState(0);
  const [flash, setFlash] = useState(false);
  const [difficulty, setDifficulty] = useState<keyof typeof DIFF>("standard");

  /* ---------- états de couleur du panier / ballon ----------
   * - "ice"    : 2 swishs d'affilée -> bleu glace + séquence gel/craquelure/explosion COLD + sticker.
   *              Conservé tant que le tir suivant est réussi ; retour normal dès le 1er échec.
   * - "sunset" : 3 tirs consécutifs entrants -> glow gradient rouge / rose / orange sur le panier.
   *              Conservé sur les tirs entrants ; retour normal si 4 tirs échouent.
   */
  const [colorMode, setColorMode] = useState<HoopColorMode>("normal");
  const [sunsetMisses, setSunsetMisses] = useState(0);
  const [iceTriggerId, setIceTriggerId] = useState(0);

  const colorModeRef = useRef<HoopColorMode>("normal");
  const swishStreakRef = useRef(0);
  const madeStreakRef = useRef(0);
  const sunsetMissesRef = useRef(0);
  colorModeRef.current = colorMode;
  sunsetMissesRef.current = sunsetMisses;

  const fieldRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const powerRef = useRef<HTMLSpanElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const elasticRef = useRef<SVGPathElement>(null);
  const previewRef = useRef<SVGPathElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pfRef = useRef<ParticleField | null>(null);
  const geomRef = useRef<Geom>(computeGeom(dims.w, dims.h));
  const visibleRef = useRef(true);
  const streakRef = useRef(streak);
  const queueRef = useRef(queue);
  const shownRef = useRef(shownFile);
  const targetRef = useRef(target);
  const bannerTimer = useRef<number | null>(null);

  const G = useRef<GameState>({
    phase: "idle",
    ball: { x: 0, y: 0 },
    rot: 0,
    scale: 1,
    origin: { x: 0, y: 0 },
    drag: { x: 0, y: 0 },
    power: 0,
    gauge: 0,
    gphase: 0,
    flight: null,
    outcome: null,
    ret: null,
    shake: 0,
    bob: 0,
    gpos: { x: 0, y: 0 },
    frozenPower: 0,
  }).current;

  const diffRef = useRef(1);

  streakRef.current = streak;
  queueRef.current = queue;
  shownRef.current = shownFile;
  targetRef.current = target;
  diffRef.current = DIFF[difficulty].k;

  const resetColorState = useCallback(() => {
    swishStreakRef.current = 0;
    madeStreakRef.current = 0;
    sunsetMissesRef.current = 0;
    colorModeRef.current = "normal";
    setColorMode("normal");
    setSunsetMisses(0);
  }, []);

  const handleIceShatter = useCallback(() => {
    const g = geomRef.current;
    G.shake = 10;
    pfRef.current?.confetti(
      g.w * 0.5,
      g.h * 0.5,
      110,
      ["#ffffff", "#d9f7ff", "#6fd3ff", "#32b4ff", "#a6ebff"],
      1.5
    );
    pfRef.current?.ring(g.w * 0.5, g.h * 0.5, "rgba(182,238,255,.95)", 32);
    pfRef.current?.sparks(g.rim.x, g.rim.y, 28, "#8fe2ff", 240);
  }, [G]);

  /* ---------- géométrie ---------- */
  const geom = useMemo(() => computeGeom(dims.w, dims.h), [dims]);
  geomRef.current = geom;

  useEffect(() => {
    if (G.phase === "idle" || G.phase === "return") G.ball = { ...geom.rest };
    pfRef.current?.resize(dims.w, dims.h, Math.min(2, window.devicePixelRatio || 1));
  }, [dims, geom, G]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setDims({ w: Math.max(320, r.width), h: Math.max(300, r.height) });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setDims({ w: Math.max(320, r.width), h: Math.max(300, r.height) });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!pfRef.current) pfRef.current = new ParticleField(canvasRef.current);
    pfRef.current.resize(dims.w, dims.h, Math.min(2, window.devicePixelRatio || 1));
  }, [dims]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => (visibleRef.current = e[0].isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ---------- fin de session : on remet les couleurs au normal ---------- */
  useEffect(() => {
    if (summary) resetColorState();
  }, [summary, resetColorState]);

  /* ---------- flash quand un fichier arrive de l'explorateur ---------- */
  const firstPulse = useRef(true);
  useEffect(() => {
    if (firstPulse.current) {
      firstPulse.current = false;
      return;
    }
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 900);
    return () => window.clearTimeout(t);
  }, [pulse]);

  /* ---------- synchronisation du ballon affiché ---------- */
  useEffect(() => {
    const cur = shownRef.current;
    if (!queue.length) {
      if (cur) setShownFile(null);
      return;
    }
    if (!cur || !queue.some((f) => f.id === cur.id)) setShownFile(queue[0]);
  }, [queue]);

  const showBanner = useCallback(
    (b: { kind: ResultKind; delta: number; pts: number; weak?: boolean }, durMs = 1750) => {
      setBanner({ ...b, id: Date.now() });
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
      bannerTimer.current = window.setTimeout(() => setBanner(null), durMs);
    },
    []
  );

  /* ---------- construction du vol ---------- */
  const buildFlight = useCallback(
    (kind: ResultKind, p0: V, g: Geom, weak: boolean): Seg[] => {
      const { rim, rimR, bin, floorY, ballR, w, h } = g;
      const peak = rim.y - h * 0.155;
      const netHit = () => {
        setNetKey((k) => k + 1);
        setLit(true);
        window.setTimeout(() => setLit(false), 700);
      };
      const intoBin = () => {
        netHit();
        setBinKick((k) => k + 1);
        sfx.play("bin");
        pfRef.current?.sparks(bin.x, bin.y - 10, 22, "#6fd3ff", 200);
      };

      if (weak) {
        const short = { x: p0.x + (rim.x - p0.x) * 0.42, y: p0.y - h * 0.17 };
        const land = { x: Math.min(w - ballR, short.x + w * 0.05), y: floorY - ballR * 0.2 };
        return [
          { p0, c: arcCtl(p0, short, Math.min(p0.y, short.y) - h * 0.06), p1: short, dur: 0.5, spin: 3 },
          {
            p0: short,
            c: { x: short.x + (land.x - short.x) * 0.5, y: short.y - h * 0.02 },
            p1: land,
            dur: 0.34,
            spin: 4,
            onEnd: () => {
              sfx.play("airball");
              pfRef.current?.dust(land.x, land.y, 12);
            },
          },
        ];
      }

      switch (kind) {
        case "swish":
          return [
            {
              p0,
              c: arcCtl(p0, rim, peak),
              p1: rim,
              dur: 0.74,
              spin: 2.6,
              onEnd: () => {
                netHit();
                sfx.play("swish");
                pfRef.current?.ring(rim.x, rim.y, "rgba(67,227,155,.9)", 16);
                pfRef.current?.sparks(rim.x, rim.y + 8, 20, "#43e39b", 190);
              },
            },
            {
              p0: rim,
              c: { x: rim.x + (bin.x - rim.x) * 0.35, y: rim.y + h * 0.1 },
              p1: bin,
              dur: 0.3,
              spin: 1.2,
              s1: 0.2,
              onEnd: intoBin,
            },
          ];
        case "bank":
        case "lucky": {
          const lip = { x: rim.x - rimR * 0.85, y: rim.y - 5 };
          const up = {
            x: rim.x + (kind === "lucky" ? -rimR * 0.1 : rimR * 0.25),
            y: rim.y - (kind === "lucky" ? h * 0.085 : h * 0.055),
          };
          return [
            {
              p0,
              c: arcCtl(p0, lip, peak),
              p1: lip,
              dur: 0.7,
              spin: 2.4,
              onEnd: () => {
                sfx.play("rim");
                pfRef.current?.sparks(lip.x, lip.y, 14, "#f6c453", 210);
              },
            },
            { p0: lip, c: arcCtl(lip, up, up.y - h * 0.02), p1: up, dur: 0.19, spin: 3 },
            {
              p0: up,
              c: { x: up.x + (rim.x - up.x) * 0.5, y: Math.min(up.y, rim.y) - 6 },
              p1: rim,
              dur: 0.18,
              spin: 2,
              onEnd: () => {
                netHit();
                sfx.play("drop");
              },
            },
            { p0: rim, c: { x: rim.x + (bin.x - rim.x) * 0.35, y: rim.y + h * 0.1 }, p1: bin, dur: 0.3, spin: 1, s1: 0.2, onEnd: intoBin },
          ];
        }
        case "rimout": {
          const lip = { x: rim.x - rimR * 0.9, y: rim.y - 4 };
          const out = { x: Math.min(w - ballR, rim.x + rimR * 2.1), y: rim.y - h * 0.06 };
          const land = { x: Math.min(w - ballR, out.x + w * 0.045), y: floorY - ballR * 0.25 };
          return [
            {
              p0,
              c: arcCtl(p0, lip, peak),
              p1: lip,
              dur: 0.7,
              spin: 2.4,
              onEnd: () => {
                sfx.play("rim");
                pfRef.current?.sparks(lip.x, lip.y, 12, "#ff4f5a", 200);
              },
            },
            { p0: lip, c: arcCtl(lip, out, out.y - h * 0.03), p1: out, dur: 0.26, spin: 4 },
            {
              p0: out,
              c: { x: out.x + 12, y: out.y + (land.y - out.y) * 0.2 },
              p1: land,
              dur: 0.34,
              spin: 5,
              onEnd: () => {
                sfx.play("buzzer");
                pfRef.current?.dust(land.x, land.y, 16);
              },
            },
            { p0: land, c: { x: land.x + 22, y: land.y - h * 0.07 }, p1: { x: land.x + 46, y: land.y }, dur: 0.34, spin: 4 },
          ];
        }
        default: {
          const miss = { x: rim.x + rimR * 1.25, y: rim.y - h * 0.05 };
          const land = { x: Math.min(w - ballR, miss.x + w * 0.07), y: floorY - ballR * 0.25 };
          return [
            {
              p0,
              c: arcCtl(p0, miss, peak + h * 0.02),
              p1: miss,
              dur: 0.72,
              spin: 2.8,
              onEnd: () => sfx.play("airball"),
            },
            {
              p0: miss,
              c: { x: miss.x + 18, y: miss.y + (land.y - miss.y) * 0.15 },
              p1: land,
              dur: 0.4,
              spin: 4,
              onEnd: () => {
                sfx.play("buzzer");
                pfRef.current?.dust(land.x, land.y, 18);
              },
            },
          ];
        }
      }
    },
    []
  );

  /* ---------- résolution immédiate ----------
   * Dès la fin du vol : effets, bannière, points, streaks,
   * fichier suivant. Aucun temps mort entre les tirs —
   * le seul délai est celui du résumé de fin de session (3 s).
   */
  const resolve = useCallback(() => {
    const g = geomRef.current;
    const o = G.outcome;
    const file = shownRef.current;
    if (!o || !file) {
      G.phase = "return";
      G.ret = { from: { ...G.ball }, t: 0, dur: 0.4, s0: G.scale };
      G.flight = null;
      setPhase("return");
      return;
    }
    const q = queueRef.current;
    const next = o.made ? q.find((f) => f.id !== file.id) ?? null : q.length > 1 ? q[1] : q[0];

    const nextSwish = o.made && o.kind === "swish" ? swishStreakRef.current + 1 : 0;
    const nextMade = o.made ? madeStreakRef.current + 1 : 0;
    swishStreakRef.current = nextSwish;
    madeStreakRef.current = nextMade;

    const prevMode = colorModeRef.current;
    let nextMode: HoopColorMode = prevMode;
    let nextSunsetMisses = sunsetMissesRef.current;
    let triggeredCold = false;

    if (nextSwish >= 2 && nextSwish % 2 === 0) {
      // 2 swishs consécutifs : bleu glace + gel de l'aire de jeu -> craquelure -> explosion COLD + sticker
      nextMode = "ice";
      nextSunsetMisses = 0;
      triggeredCold = true;
    } else if (prevMode === "ice") {
      // après l'animation : si réussi on conserve le bleu glace, si échoué retour couleur normale
      if (o.made) {
        nextMode = "ice";
      } else {
        nextMode = "normal";
        nextSunsetMisses = 0;
      }
    } else if (prevMode === "sunset") {
      // glow rouge / rose / orange : si 4 tirs échouent -> retour normal, sinon couleur conservée
      if (o.made) {
        nextMode = "sunset";
      } else {
        nextSunsetMisses += 1;
        if (nextSunsetMisses >= 4) {
          nextMode = "normal";
          nextSunsetMisses = 0;
        } else {
          nextMode = "sunset";
        }
      }
    } else if (nextMade >= 3) {
      // 3 tirs consécutifs entrants -> glow gradient entre le rouge, le rose et l'orange
      nextMode = "sunset";
      nextSunsetMisses = 0;
      sfx.play("fire");
      pfRef.current?.confetti(g.rim.x, g.rim.y - 10, 68, ["#ff2438", "#ff4db8", "#ff8a1f", "#ffd6eb"], 1.3);
    }

    colorModeRef.current = nextMode;
    sunsetMissesRef.current = nextSunsetMisses;
    setColorMode(nextMode);
    setSunsetMisses(nextSunsetMisses);
    if (triggeredCold) {
      setIceTriggerId((n) => n + 1);
    }

    if (o.made) {
      const mult = comboMultiplier(streakRef.current);
      const burstColors =
        nextMode === "ice"
          ? ["#ffffff", "#c8f3ff", "#5ec8ff", "#38b6ff"]
          : nextMode === "sunset"
            ? ["#ff2438", "#ff4db8", "#ff8a1f", "#ffe0f0"]
            : CONFETTI;
      pfRef.current?.confetti(g.bin.x, g.bin.y - 14, o.kind === "swish" ? 65 : 36, burstColors, o.kind === "swish" ? 1.15 : 0.9);
      if (o.kind === "swish") {
        pfRef.current?.ring(
          g.rim.x,
          g.rim.y,
          nextMode === "ice" ? "rgba(111,211,255,.95)" : "rgba(67,227,155,.9)",
          22
        );
      }
      if (mult >= 2 && !triggeredCold) sfx.play("fire");
    } else {
      G.shake = o.kind === "airball" ? 13 : 8;
      pfRef.current?.sparks(G.ball.x, G.ball.y, 12, "#ff4f5a", 150);
    }

    if (o.made && onFileDunked && file) {
      onFileDunked(file.name);
    }

    showBanner({ kind: o.kind, delta: o.delta, pts: o.points, weak: o.weak }, triggeredCold ? 620 : 1750);
    d.registerShot(file, o);
    setShownFile(next);
    setHint(false);

    G.phase = "return";
    G.ret = { from: { ...G.ball }, t: 0, dur: o.made ? 0.52 : 0.46, s0: G.scale };
    G.outcome = null;
    G.flight = null;
    setPhase("return");
    setTarget(30 + Math.floor(Math.random() * 55));
  }, [G, d, showBanner]);

  /* ---------- tir ---------- */
  const shoot = useCallback(() => {
    const g = geomRef.current;
    const file = shownRef.current;
    if (!file) return;
    const power = G.power;
    const value = G.gauge;
    const tgt = targetRef.current;
    const delta = Math.abs(value - tgt);
    const weak = power < MIN_POWER;

    let kind: ResultKind;
    if (weak) kind = "airball";
    else if (delta <= 2) kind = "swish";
    else if (delta <= 8) kind = "bank";
    else if (delta <= 15) kind = Math.random() < 0.5 ? "lucky" : "rimout";
    else kind = "airball";

    const made = kind === "swish" || kind === "bank" || kind === "lucky";
    const mult = comboMultiplier(streakRef.current);
    const pts = made ? Math.round(BASE_POINTS[kind] * mult * (1 + power * 0.65)) : 0;

    const outcome = { kind, made, delta, gauge: value, target: tgt, power, points: pts, weak };
    G.outcome = outcome;
    G.flight = { segs: buildFlight(kind, { ...G.ball }, g, weak), i: 0, t: 0 };
    G.phase = "flight";
    G.drag = { x: 0, y: 0 };
    G.frozenPower = power;
    setPhase("flight");
    sfx.play("release");
    pfRef.current?.sparks(G.ball.x, G.ball.y, 16, "#ffb07e", 240);
    pfRef.current?.ring(G.ball.x, G.ball.y, "rgba(255,176,126,.8)", 12);
  }, [G, buildFlight]);

  /* ---------- boucle de rendu ---------- */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visibleRef.current) return;
      const g = geomRef.current;
      if (!g.w) return;

      G.bob += dt;

      if (G.phase === "idle") {
        G.ball.x += (g.rest.x - G.ball.x) * Math.min(1, dt * 9);
        G.ball.y = g.rest.y + Math.sin(G.bob * 1.9) * 3.2;
        G.rot += dt * 0.35;
        G.scale += (1 - G.scale) * Math.min(1, dt * 8);
      } else if (G.phase === "aim") {
        let speed = (0.28 + 0.62 * G.power) * diffRef.current;
        // mode difficile : plus le fichier est lourd, plus l'aiguille s'emballe
        if (diffRef.current > 1.2) {
          const kb = shownRef.current?.sizeKb ?? 1;
          speed *= 1 + Math.min(0.45, Math.log10(Math.max(1, kb)) / 14);
        }
        G.gphase = (G.gphase + dt * speed * 2) % 2;
        G.gauge = (G.gphase < 1 ? G.gphase : 2 - G.gphase) * 100;
        G.ball.y = g.rest.y + G.drag.y + Math.sin(G.bob * 9) * G.power * 2.4;
        G.ball.x = g.rest.x + G.drag.x;
        G.rot += dt * (0.4 + G.power * 2.2);
        G.scale = 1 + G.power * 0.06;
        if (colorModeRef.current === "ice" && Math.random() < 0.55) {
          pfRef.current?.trail(
            G.ball.x + (Math.random() - 0.5) * g.ballR,
            G.ball.y + g.ballR * 0.35,
            Math.random() < 0.5 ? "#d9f7ff" : "#5ec8ff",
            4 + Math.random() * 4
          );
        }
      } else if (G.phase === "flight" && G.flight) {
        const f = G.flight;
        const seg = f.segs[f.i];
        if (seg) {
          f.t += dt / seg.dur;
          if (f.t >= 1) {
            seg.onEnd?.();
            G.ball = { ...seg.p1 };
            G.scale = seg.s1 ?? 1;
            f.t = 0;
            f.i += 1;
            if (f.i >= f.segs.length) {
              resolve();
            }
          } else {
            const p = qbez(seg, f.t);
            if (seg.s1 !== undefined) G.scale = 1 + (seg.s1 - 1) * f.t;
            G.ball = p;
            G.rot += dt * seg.spin * 3.4;
            if (Math.random() < 0.85) {
              const mode = colorModeRef.current;
              const trailColor =
                mode === "ice"
                  ? "rgba(130,224,255,.78)"
                  : mode === "sunset"
                    ? ["#ff2438aa", "#ff4db8aa", "#ff8a1faa"][(Math.random() * 3) | 0]
                    : "rgba(255,176,126,.55)";
              pfRef.current?.trail(
                p.x + (Math.random() - 0.5) * 6,
                p.y + (Math.random() - 0.5) * 6,
                trailColor,
                mode === "normal" ? 4 : 6
              );
            }
          }
        }
      } else if (G.phase === "return" && G.ret) {
        G.ret.t += dt / G.ret.dur;
        const t = Math.min(1, G.ret.t);
        const e = easeOutBack(t);
        G.ball.x = G.ret.from.x + (g.rest.x - G.ret.from.x) * e;
        G.ball.y = G.ret.from.y + (g.rest.y - G.ret.from.y) * e;
        G.scale = G.ret.s0 + (1 - G.ret.s0) * Math.min(1, t * 1.6);
        G.rot += dt * 2.4 * (1 - t);
        if (t >= 1) {
          G.phase = "idle";
          G.ret = null;
          setPhase("idle");
        }
      }

      /* écriture DOM */
      const ballEl = ballRef.current;
      if (ballEl) {
        ballEl.style.transform = `translate3d(${G.ball.x}px,${G.ball.y}px,0) rotate(${G.rot}rad) scale(${G.scale})`;
      }

      const gaugeEl = gaugeRef.current;
      if (gaugeEl) {
        const show = G.phase === "aim" || G.phase === "flight";
        gaugeEl.style.opacity = show ? "1" : "0";
        if (show) {
          if (G.phase === "aim") {
            const gw = g.gaugeW;
            G.gpos.x = Math.max(10, Math.min(g.w - gw - 10, G.ball.x - gw / 2));
            G.gpos.y = Math.min(g.h - 52, G.ball.y + g.ballR + 20);
          }
          gaugeEl.style.transform = `translate3d(${G.gpos.x}px,${G.gpos.y}px,0)`;
          if (needleRef.current) needleRef.current.style.left = `${G.gauge}%`;
          if (readoutRef.current) readoutRef.current.textContent = G.gauge.toFixed(0).padStart(2, "0");
          if (powerRef.current)
            powerRef.current.textContent = `${Math.round((G.phase === "aim" ? G.power : G.frozenPower) * 100)}%`;
          if (bandRef.current) {
            const near = Math.abs(G.gauge - targetRef.current);
            bandRef.current.style.boxShadow =
              near <= 2
                ? "0 0 22px rgba(67,227,155,.75)"
                : near <= 8
                  ? "0 0 16px rgba(246,196,83,.5)"
                  : "0 0 0 rgba(0,0,0,0)";
          }
        }
      }

      if (elasticRef.current) {
        if (G.phase === "aim" && (Math.abs(G.drag.x) > 3 || Math.abs(G.drag.y) > 3)) {
          const mx = (g.rest.x + G.ball.x) / 2;
          const my = (g.rest.y + G.ball.y) / 2 + 14;
          elasticRef.current.setAttribute("d", `M${g.rest.x} ${g.rest.y} Q${mx} ${my} ${G.ball.x} ${G.ball.y}`);
          elasticRef.current.style.opacity = "1";
        } else {
          elasticRef.current.style.opacity = "0";
        }
      }

      if (previewRef.current) {
        if (G.phase === "aim" && G.power > 0.06) {
          const c = arcCtl({ ...G.ball }, g.rim, g.rim.y - g.h * 0.155);
          previewRef.current.setAttribute(
            "d",
            `M${G.ball.x} ${G.ball.y} Q${c.x} ${c.y} ${g.rim.x} ${g.rim.y}`
          );
          previewRef.current.style.opacity = String(0.18 + G.power * 0.5);
        } else {
          previewRef.current.style.opacity = "0";
        }
      }

      if (G.shake > 0.15 && shakeRef.current) {
        G.shake *= Math.pow(0.0016, dt);
        const a = Math.random() * Math.PI * 2;
        shakeRef.current.style.transform = `translate(${Math.cos(a) * G.shake}px,${Math.sin(a) * G.shake}px)`;
      } else if (shakeRef.current && G.shake !== 0) {
        G.shake = 0;
        shakeRef.current.style.transform = "translate(0,0)";
      }

      pfRef.current?.step(dt);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [G, resolve]);

  /* ---------- pointeurs ---------- */
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;

    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const down = (e: PointerEvent) => {
      if (!shownRef.current || G.phase !== "idle") return;
      sfx.unlock();
      const p = local(e);
      el.setPointerCapture(e.pointerId);
      G.phase = "aim";
      G.origin = p;
      G.drag = { x: 0, y: 0 };
      G.power = 0;
      G.gauge = 0;
      G.gphase = 0;
      setPhase("aim");
      setHint(false);
      sfx.play("grab");
      pfRef.current?.ring(G.ball.x, G.ball.y, "rgba(246,196,83,.7)", 10);
    };

    const move = (e: PointerEvent) => {
      if (G.phase !== "aim") return;
      const g = geomRef.current;
      const p = local(e);
      let dx = p.x - G.origin.x;
      let dy = p.y - G.origin.y;
      const len = Math.hypot(dx, dy);
      const max = g.maxPull;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      G.drag = { x: dx, y: dy };
      const weighted = dy > 0 ? Math.hypot(dx, dy) : Math.hypot(dx * 0.7, dy * 0.55);
      G.power = Math.max(0, Math.min(1, weighted / max));
      const nx = Math.max(g.ballR, Math.min(g.w * 0.5, g.rest.x + dx));
      const ny = Math.max(g.h * 0.34, Math.min(g.floorY - 6, g.rest.y + dy));
      G.drag = { x: nx - g.rest.x, y: ny - g.rest.y };
    };

    const up = () => {
      if (G.phase !== "aim") return;
      if (G.power < 0.05) {
        G.phase = "return";
        G.ret = { from: { ...G.ball }, t: 0, dur: 0.3, s0: G.scale };
        setPhase("return");
        return;
      }
      shoot();
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [G, shoot]);

  /* ---------- clavier ---------- */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" && queueRef.current.length) {
        sfx.play("error");
        G.phase = "idle";
        G.flight = null;
        G.ret = null;
        G.outcome = null;
        G.ball = { ...geomRef.current.rest };
        setPhase("idle");
        setShownFile(null);
        resetColorState();
        d.cancelSession();
        window.setTimeout(() => d.refill(5), 700);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [G, d, resetColorState]);

  const mult = comboMultiplier(streak);
  const accuracy = shots ? Math.round((swishes / shots) * 100) : 0;
  const bands = useMemo(() => {
    const t = target;
    return [
      { from: t - 15, to: t + 15, color: "rgba(234,90,36,.42)", label: "" },
      { from: t - 8, to: t + 8, color: "rgba(246,196,83,.6)", label: "" },
      { from: t - 2, to: t + 2, color: "rgba(67,227,155,.95)", label: "" },
    ];
  }, [target]);

  const bannerTone = banner
    ? banner.kind === "swish"
      ? { c: "#43e39b", t: banner.weak ? "Trop mou !" : "SWISH !" }
      : banner.kind === "bank"
        ? { c: "#f6c453", t: "PANIER" }
        : banner.kind === "lucky"
          ? { c: "#6fd3ff", t: "REBOND GAGNANT" }
          : { c: "#ff4f5a", t: banner.weak ? "TROP MOU !" : banner.kind === "rimout" ? "REBOND RATÉ" : "AIR BALL" }
    : null;

  return (
    <section id="dunker" className="relative z-10 mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-6">
      <div
        className={`relative overflow-hidden rounded-[20px] transition-shadow duration-500 ${
          transparent
            ? "border-none bg-transparent shadow-none"
            : `border bg-arena-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)] ${
                flash ? "border-dunk-500 shadow-[0_0_0_3px_rgba(234,90,36,.28),0_40px_120px_-30px_rgba(0,0,0,.9)]" : "border-arena-700/80"
              }`
        }`}
      >
        {/* ---------- SCOREBUG (masqué en mode minimal transparent) ---------- */}
        {!transparent && (
          <div className="relative flex flex-wrap items-stretch gap-px border-b border-arena-700/70 bg-arena-950/80 text-chalk">
            <div className="flex items-center gap-2.5 bg-dunk-600 px-3 py-2 sm:px-4">
              <span className="display text-[19px] leading-none tracking-wide text-white sm:text-[23px]">
                Trash<span className="text-arena-950">Dunk</span>
              </span>
            </div>

            <Stat label="Score" value={score.toLocaleString("fr-FR")} big />
            <Stat
              label="Streak"
              value={`${streak}`}
              suffix={mult > 1 ? `×${mult}` : undefined}
              accent={
                colorMode === "ice" ? "#6fd3ff" : colorMode === "sunset" ? "#ff4db8" : undefined
              }
            />
            <Stat label="Cible" value={`${target}`} suffix="%" accent="#43e39b" />
            <Stat label="Restants" value={`${queue.length}`} />
            <Stat label="Corbeille" value={`${trashed.length}`} accent="#6fd3ff" />

            <div className="ml-auto flex items-center gap-2 px-3">
              <button
                onClick={() => {
                  sfx.unlock();
                  d.toggleSound();
                }}
                className="group flex items-center gap-1.5 rounded-md border border-arena-600 bg-arena-850 px-2.5 py-1.5 text-[11px] font-medium text-chalk-dim transition hover:border-dunk-500 hover:text-chalk"
                aria-pressed={soundOn}
              >
                <SoundIcon on={soundOn} />
                <span className="hidden sm:inline">{soundOn ? "Son activé" : "Muet"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ---------- TERRAIN ---------- */}
        <div
          ref={fieldRef}
          role="application"
          aria-label="Terrain TrashDunk : cliquez-glissez vers le bas pour charger la jauge, relâchez pour tirer. Échap annule la session."
          className="relative h-[clamp(400px,58vh,600px)] w-full cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing"
          style={{
            background: transparent
              ? "transparent"
              : "linear-gradient(180deg,#0a0e15 0%,#111823 46%,#1a1410 74%,#241a12 100%)",
          }}
        >
          <div ref={shakeRef} className="absolute inset-0">
            {/* foule */}
            <div
              className="absolute inset-x-0 top-0 h-[42%] opacity-[0.5]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 50%, rgba(255,255,255,.22) 1.6px, transparent 2px), radial-gradient(circle at 50% 50%, rgba(234,90,36,.18) 1.6px, transparent 2px)",
                backgroundSize: "13px 11px, 17px 13px",
                backgroundPosition: "0 0, 6px 5px",
                filter: "blur(2.4px)",
                maskImage: "linear-gradient(180deg,#000 0%,rgba(0,0,0,.5) 55%,transparent 100%)",
                WebkitMaskImage: "linear-gradient(180deg,#000 0%,rgba(0,0,0,.5) 55%,transparent 100%)",
              }}
            />
            {/* projecteurs */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 42% at 50% -6%, rgba(255,238,200,.16), transparent 70%), radial-gradient(38% 34% at 78% 6%, rgba(111,211,255,.1), transparent 70%)",
              }}
            />
            {/* balayage de projecteur */}
            <div
              className="sweep pointer-events-none absolute inset-y-0 left-0 w-[26%]"
              style={{ background: "linear-gradient(90deg,transparent,rgba(255,241,214,.10),transparent)" }}
              aria-hidden
            />
            {/* parquet */}
            <div className="hardwood absolute inset-x-0 bottom-0 h-[16%]" style={{ boxShadow: "inset 0 14px 26px rgba(0,0,0,.55)" }}>
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(255,220,170,.22), rgba(0,0,0,.35))" }}
              />
            </div>
            {/* lignes de terrain */}
            <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${dims.w} ${dims.h}`} preserveAspectRatio="none">
              <g fill="none" stroke="#f5f0e6" strokeOpacity="0.2" strokeWidth="2">
                <path d={`M0 ${geom.floorY} H${dims.w}`} strokeOpacity="0.32" />
                <path
                  d={`M${dims.w} ${geom.floorY - 2} Q ${geom.rim.x} ${geom.floorY - geom.h * 0.145} ${Math.max(0, geom.rim.x - geom.w * 0.3)} ${geom.floorY - 2}`}
                />
                <ellipse cx={geom.rim.x} cy={geom.floorY + 7} rx={geom.hoopW * 0.44} ry={geom.h * 0.026} strokeOpacity="0.13" />
                <path d={`M${geom.rest.x} ${geom.floorY} v${geom.h * 0.03}`} strokeOpacity="0.1" strokeDasharray="3 5" />
              </g>
            </svg>
            {colorMode === "ice" && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(65% 55% at 78% 34%, rgba(94,200,255,.18), transparent 72%), radial-gradient(60% 50% at 24% 72%, rgba(111,211,255,.12), transparent 70%)",
                }}
              />
            )}
            {colorMode === "sunset" && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(58% 52% at 78% 34%, rgba(255,77,184,.2), rgba(255,138,31,.08) 45%, transparent 74%)",
                }}
              />
            )}
            {!transparent && (
              <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 140px 40px rgba(0,0,0,.72)" }} />
            )}

            {/* panier */}
            <Hoop width={geom.hoopW} left={geom.hoopLeft} top={geom.hoopTop} lit={lit} colorMode={colorMode} netKey={netKey} />

            {/* cible au-dessus du panier */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-swish/30 bg-arena-950/88 px-3 py-1.5 text-center shadow-[0_10px_30px_rgba(0,0,0,.6)] backdrop-blur-[2px]"
              style={{ left: geom.rim.x, top: Math.max(4, geom.hoopTop - 62) }}
            >
              <div className="display text-[11px] leading-none tracking-[0.26em] text-chalk-dim/75">CIBLE</div>
              <div
                className="display tnum text-[38px] leading-[0.82] text-swish sm:text-[46px]"
                style={{ textShadow: "0 0 24px rgba(67,227,155,.5)" }}
              >
                {target}
                <span className="text-[19px]">%</span>
              </div>
            </div>

            {/* corbeille */}
            <RecycleBin x={geom.bin.x} y={geom.bin.y + geom.ballR * 0.6} count={trashed.length} kick={binKick} />

            {/* élastique + trajectoire */}
            <svg className="pointer-events-none absolute inset-0" width={dims.w} height={dims.h}>
              <path ref={previewRef} d="" fill="none" stroke="#f6c453" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" style={{ opacity: 0 }} />
              <path ref={elasticRef} d="" fill="none" stroke="#f5f0e6" strokeOpacity="0.55" strokeWidth="3" strokeDasharray="7 6" style={{ opacity: 0 }} />
            </svg>

            {/* ballon */}
            <Ball ref={ballRef} file={shownFile} radius={geom.ballR} colorMode={colorMode} aiming={phase === "aim"} />

            {/* jauge */}
            <div ref={gaugeRef} className="pointer-events-none absolute top-0 left-0" style={{ width: geom.gaugeW, opacity: 0 }}>
              <div className="mb-1 flex items-end justify-between px-0.5">
                <span className="display text-[11px] tracking-[0.2em] text-chalk-dim/85">TIMING</span>
                <span className="tnum text-[11px] font-semibold text-chalk/70">
                  puissance <span ref={powerRef} className="text-dunk-400">0%</span>
                </span>
              </div>
              <div ref={bandRef} className="relative h-4 overflow-hidden rounded-[3px] border border-chalk/25 bg-arena-950/85">
                {bands.map((b, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0"
                    style={{
                      left: `${Math.max(0, b.from)}%`,
                      width: `${Math.max(0, Math.min(100, b.to) - Math.max(0, b.from))}%`,
                      background: b.color,
                    }}
                  />
                ))}
                <div
                  className="absolute inset-y-0 w-px bg-chalk"
                  style={{ left: `${target}%`, boxShadow: "0 0 8px rgba(245,240,230,.9)" }}
                />
                <div ref={needleRef} className="absolute inset-y-[-3px] w-[3px] rounded-full bg-white" style={{ left: "0%", boxShadow: "0 0 10px 2px rgba(255,255,255,.75)" }} />
                <div className="halftone absolute inset-0 opacity-25" />
              </div>
              <div className="mt-1 flex justify-between">
                <span className="tnum text-[10px] text-chalk-dim/60">0</span>
                <span ref={readoutRef} className="tnum display text-[15px] leading-none text-gold">
                  00
                </span>
                <span className="tnum text-[10px] text-chalk-dim/60">100</span>
              </div>
            </div>

            {/* indice initial */}
            {hint && phase === "idle" && shownFile && (
              <div className="pointer-events-none absolute" style={{ left: geom.rest.x, top: geom.rest.y }}>
                <div
                  className="absolute rounded-full border-2 border-gold/70"
                  style={{
                    width: geom.ballR * 3.4,
                    height: geom.ballR * 3.4,
                    left: -geom.ballR * 1.7,
                    top: -geom.ballR * 1.7,
                    animation: "td-pulse-ring 2s ease-out infinite",
                  }}
                />
                <div className="absolute -translate-x-1/2 whitespace-nowrap text-center" style={{ top: geom.ballR + 22, left: 0 }}>
                  <div className="display text-[17px] tracking-wide text-gold">Tirez vers le bas</div>
                  <div className="text-[11px] text-chalk-dim">puis relâchez pour shooter</div>
                </div>
              </div>
            )}

            {/* rappel du geste, uniquement au repos */}
            {phase === "idle" && shownFile && !hint && (
              <div className="pointer-events-none absolute bottom-2.5 left-3 text-[10.5px] text-chalk/45">
                <b className="font-semibold text-chalk/70">Glissez vers le bas</b> pour charger ·{" "}
                <b className="font-semibold text-chalk/70">relâchez</b> pour tirer
              </div>
            )}

            {/* particules */}
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />

            {/* bannière de résultat */}
            {banner && bannerTone && (
              <div key={banner.id} className="anim-pop pointer-events-none absolute inset-x-0 top-[16%] flex flex-col items-center">
                <div className="display text-[clamp(38px,7vw,76px)] leading-none" style={{ color: bannerTone.c, textShadow: `0 0 40px ${bannerTone.c}66, 0 6px 0 rgba(0,0,0,.45)` }}>
                  {bannerTone.t}
                </div>
                <div className="mt-1 flex items-center gap-2 rounded-full border border-arena-600 bg-arena-950/85 px-3 py-1 text-[11px] text-chalk-dim">
                  <span className="tnum">
                    écart <b className="text-chalk">{banner.delta.toFixed(1)}%</b>
                  </span>
                  <span className="text-arena-500">·</span>
                  <span>{RESULT_LABEL[banner.kind]}</span>
                  {banner.pts > 0 && (
                    <>
                      <span className="text-arena-500">·</span>
                      <span className="tnum font-bold text-gold">+{banner.pts} pts</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Séquence plein terrain : gel -> craquelures -> explosion « COLD » + sticker */}
            <IceSequence triggerId={iceTriggerId} onShatter={handleIceShatter} />

            {/* Indicateur clair d'état de couleur : Bleu Glace (2 swishs) */}
            {colorMode === "ice" && (
              <div className="anim-pop pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-md border border-sky-300/65 bg-sky-950/65 px-3 py-1.5 shadow-[0_0_24px_rgba(94,200,255,.35)] backdrop-blur-sm">
                <span className="text-base leading-none">❄️</span>
                <span className="display text-[20px] leading-none tracking-wide text-sky-200">COLD</span>
                <span className="text-[11px] font-medium text-sky-200/80">bleu glace actif</span>
              </div>
            )}

            {/* Indicateur clair d'état de couleur : Glow Rouge · Rose · Orange (3 tirs entrants) */}
            {colorMode === "sunset" && (
              <div
                className="anim-pop pointer-events-none absolute top-4 left-4 flex items-center gap-2.5 rounded-md border border-pink-400/60 bg-arena-950/75 px-3 py-1.5 backdrop-blur-sm"
                style={{
                  boxShadow: "0 0 24px rgba(255,77,184,.35), inset 0 0 18px rgba(255,138,31,.16)",
                }}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #ff2438 0%, #ff4db8 50%, #ff8a1f 100%)",
                  }}
                />
                <span
                  className="display text-[19px] leading-none tracking-wide"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #ff4b5c, #ff66c4, #ff9d3b)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  GLOW ×{streak > 0 ? streak : 3}
                </span>
                <span className="flex items-center gap-1 pl-0.5" title="4 tirs échoués = retour couleur normale">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full transition-opacity"
                      style={{
                        background: i < 4 - sunsetMisses ? "#ff6ec7" : "rgba(245,240,230,.18)",
                      }}
                    />
                  ))}
                </span>
              </div>
            )}

            {/* fin de session */}
            {summary && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md">
                <div className="anim-pop w-full max-w-md rounded-2xl border border-arena-600 bg-arena-950 p-6 shadow-2xl text-center">
                  <div className="display text-[13px] tracking-[0.28em] text-dunk-400 uppercase">
                    {summary.isFreeMode ? "Entraînement terminé" : "Session terminée"}
                  </div>
                  <div className="display mt-2 text-[44px] leading-none text-chalk">
                    {summary.isFreeMode ? (
                      <>
                        {summary.dunks} <span className="text-swish">panier{summary.dunks > 1 ? "s" : ""} réussi{summary.dunks > 1 ? "s" : ""}</span>
                      </>
                    ) : (
                      <>
                        {summary.dunks} <span className="text-swish">fichier{summary.dunks > 1 ? "s" : ""} supprimé{summary.dunks > 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-chalk-dim">
                    {summary.isFreeMode
                      ? "Mode sans fichier : aucun fichier sur votre disque n'a été affecté."
                      : `Envoyé${summary.dunks > 1 ? "s" : ""} dans la corbeille Windows native. Récupérable${summary.dunks > 1 ? "s" : ""} à tout moment.`}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 overflow-hidden rounded-lg border border-arena-800 bg-arena-900/80 p-2">
                    <Mini label="Swishs réussis" value={`${summary.swishes ?? swishes}`} />
                    <Mini label="Score total" value={(summary.score ?? score).toLocaleString("fr-FR")} />
                    <Mini
                      label="Temps de jeu"
                      value={
                        summary.durationSeconds !== undefined
                          ? summary.durationSeconds >= 60
                            ? `${Math.floor(summary.durationSeconds / 60)}m ${summary.durationSeconds % 60}s`
                            : `${summary.durationSeconds}s`
                          : "—"
                      }
                    />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {!summary.isFreeMode && (
                      <button
                        onClick={() => {
                          sfx.play("ui");
                          d.dismissSummary();
                          if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
                            invoke("open_recycle_bin");
                            invoke("close_overlay");
                          }
                        }}
                        className="flex-1 rounded-lg bg-swish/20 border border-swish/50 px-4 py-3 text-xs font-bold text-swish transition hover:bg-swish/30 active:scale-95"
                      >
                        🗑️ Ouvrir la corbeille
                      </button>
                    )}
                    <button
                      onClick={() => {
                        sfx.play("ui");
                        d.dismissSummary();
                        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
                          invoke("close_overlay");
                        }
                      }}
                      className="flex-1 rounded-lg bg-dunk-500 px-5 py-3 text-xs font-bold text-white transition hover:bg-dunk-400 active:scale-95"
                    >
                      {summary.isFreeMode ? "Confirmer et fermer" : "Fermer"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* pas d'écran "vide" en mode desktop */}
            {!transparent && !shownFile && !summary && !(queue.length === 0 && (trashed.length > 0 || skipped > 0)) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-arena-950/70 p-6 text-center backdrop-blur-[2px]">
                <div className="display text-[38px] leading-none text-chalk">Bureau vide</div>
                <p className="max-w-sm text-sm text-chalk-dim">
                  Faites un clic droit sur un fichier dans l'explorateur ci-dessous et choisissez
                  <span className="text-dunk-400"> « Dunk it »</span> pour l'envoyer au terrain.
                </p>
                <button
                  onClick={() => {
                    sfx.play("ui");
                    d.refill(5);
                  }}
                  className="display rounded-lg bg-dunk-500 px-5 py-3 text-[21px] tracking-wide text-white transition hover:bg-dunk-400 active:scale-[.98]"
                >
                  Charger 5 fichiers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---------- CONTRÔLES (simplifié en mode transparent : juste la file d'attente) ---------- */}
        <div
          className={`flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:gap-5 lg:p-4 ${
            transparent
              ? "rounded-xl border border-arena-700/60 bg-arena-950/85 backdrop-blur-sm"
              : "border-t border-arena-700/70 bg-arena-950/70"
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="display mb-1.5 flex items-center justify-between text-[12px] tracking-[0.24em] text-chalk-dim/70">
              <span>{d.isFreeMode ? "File d'attente (Mode Illimité)" : "File d'attente"}</span>
              {d.isFreeMode && (
                <span className="text-[10px] text-dunk-400 font-sans tracking-normal font-semibold">
                  Entraînement actif
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {d.isFreeMode ? (
                <span className="flex items-center gap-2 rounded-md border border-dunk-500/70 bg-dunk-700/25 px-3 py-1 text-sm font-bold text-chalk">
                  <span>🏀</span>
                  <span className="text-xl leading-none text-swish">∞</span>
                  <span className="text-xs text-chalk-dim">Ballons illimités</span>
                </span>
              ) : (
                <>
                  {queue.length === 0 && <span className="text-xs text-arena-500">— aucun fichier —</span>}
                  {queue.slice(0, 8).map((f, i) => {
                    const m = extMeta(f.ext);
                    return (
                      <span
                        key={f.id}
                        className={`flex max-w-[190px] items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
                          i === 0
                            ? "border-dunk-500/70 bg-dunk-700/25 text-chalk"
                            : "border-arena-700 bg-arena-850 text-chalk-dim"
                        }`}
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: m.bg }} />
                        <span className="truncate">{f.name}</span>
                        <span className="shrink-0 text-[9px] text-arena-500">.{f.ext}</span>
                      </span>
                    );
                  })}
                  {queue.length > 8 && <span className="text-[11px] text-arena-500">+{queue.length - 8}</span>}
                </>
              )}
            </div>
          </div>

          {d.isFreeMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sfx.play("ui");
                  d.requestEndSession?.();
                }}
                className="rounded-lg border border-red-500/50 bg-red-950/60 px-4 py-2 text-xs font-bold text-red-200 transition hover:bg-red-900/80 active:scale-95 shadow-md"
              >
                Terminer la session
              </button>
            </div>
          )}

          {!transparent && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 flex items-center gap-2">
                <span className="text-[10px] tracking-[0.16em] text-chalk-dim/60 uppercase">Jauge</span>
                <div className="flex overflow-hidden rounded-md border border-arena-600">
                  {(Object.keys(DIFF) as Array<keyof typeof DIFF>).map((k) => (
                    <button
                      key={k}
                      title={DIFF[k].note}
                      onClick={() => {
                        sfx.play("ui");
                        setDifficulty(k);
                      }}
                      className={`px-2.5 py-1.5 text-[11px] font-semibold transition ${
                        difficulty === k
                          ? "bg-dunk-500 text-white"
                          : "bg-arena-850 text-chalk-dim hover:bg-arena-800 hover:text-chalk"
                      }`}
                    >
                      {DIFF[k].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mr-1 hidden text-right sm:block">
                <div className="tnum display text-[24px] leading-none text-chalk">{accuracy}%</div>
                <div className="text-[10px] tracking-wider text-chalk-dim/70 uppercase">
                  swish · {airballs} air ball{airballs > 1 ? "s" : ""}
                </div>
              </div>
              <Btn onClick={() => { sfx.play("ui"); d.skipActive(); }} disabled={!queue.length}>
                Passer
              </Btn>
              <Btn onClick={() => { sfx.play("ui"); d.refill(5); }}>+ 5 fichiers</Btn>
              <Btn
                onClick={() => {
                  sfx.play("error");
                  resetColorState();
                  d.cancelSession();
                  window.setTimeout(() => d.refill(5), 700);
                }}
                disabled={!queue.length}
                danger
              >
                Annuler <span className="ml-1 rounded border border-current/40 px-1 text-[9px] opacity-70">Échap</span>
              </Btn>
            </div>
          )}
        </div>
      </div>

      {!transparent && (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-chalk-dim/70">
          <span className="flex items-center gap-1.5">
            <Dot c="#43e39b" /> swish ≤ 2 %
          </span>
          <span className="flex items-center gap-1.5">
            <Dot c="#f6c453" /> panier ≤ 8 %
          </span>
          <span className="flex items-center gap-1.5">
            <Dot c="#ea5a24" /> rebond ≤ 15 %
          </span>
          <span className="flex items-center gap-1.5">
            <Dot c="#ff4f5a" /> air ball &gt; 15 %
          </span>
          <span className="flex items-center gap-1.5 text-sky-300/85">
            <Dot c="#5ec8ff" /> 2 swishs = COLD (glace)
          </span>
          <span className="flex items-center gap-1.5 text-pink-300/85">
            <Dot c="#ff4db8" /> 3 entrants = glow rouge·rose·orange
          </span>
          <span className="ml-auto tnum">
            Carrière : {persisted.totalDunks} dunk{persisted.totalDunks > 1 ? "s" : ""} · record streak {persisted.bestStreak} ·{" "}
            {persisted.sessions} session{persisted.sessions > 1 ? "s" : ""}
          </span>
        </p>
      )}
    </section>
  );
}

/* ---------- petits composants locaux ---------- */

function Dot({ c }: { c: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />;
}

function Stat({
  label,
  value,
  suffix,
  accent,
  big,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: string;
  big?: boolean;
}) {
  return (
    <div className="flex min-w-[74px] flex-col justify-center border-l border-arena-800 px-3 py-1.5">
      <span className="text-[9px] tracking-[0.18em] text-chalk-dim/65 uppercase">{label}</span>
      <span className="flex items-baseline gap-1">
        <span
          className={`tnum display leading-none ${big ? "text-[30px] sm:text-[36px]" : "text-[24px] sm:text-[28px]"}`}
          style={{ color: accent ?? "#f5f0e6" }}
        >
          {value}
        </span>
        {suffix && <span className="tnum text-[12px] font-bold" style={{ color: accent ?? "#bdb4a2" }}>{suffix}</span>}
      </span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-arena-850 px-3 py-2">
      <div className="text-[9px] tracking-[0.16em] text-chalk-dim/70 uppercase">{label}</div>
      <div className="tnum display text-[26px] leading-none text-chalk">{value}</div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3 py-2 text-[12px] font-semibold transition active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? "border-buzz/40 bg-buzz/10 text-buzz hover:border-buzz hover:bg-buzz/20"
          : "border-arena-600 bg-arena-850 text-chalk-dim hover:border-dunk-500 hover:text-chalk"
      }`}
    >
      {children}
    </button>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" />
        </>
      ) : (
        <path d="M17 9.5l5 5m0-5l-5 5" />
      )}
    </svg>
  );
}

function RecycleBin({ x, y, count, kick }: { x: number; y: number; count: number; kick: number }) {
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (!kick) return;
    setBump(1);
    const t = window.setTimeout(() => setBump(0), 420);
    return () => window.clearTimeout(t);
  }, [kick]);

  return (
    <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: x, top: y }}>
      <div className="relative" style={{ transform: bump ? "scale(1.09)" : "scale(1)", transition: "transform .18s cubic-bezier(.2,1.6,.4,1)" }}>
        <svg width="58" height="70" viewBox="0 0 58 70" className="drop-shadow-[0_10px_14px_rgba(0,0,0,.6)]">
          <defs>
            <linearGradient id="td-bin" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2b3543" />
              <stop offset="45%" stopColor="#46586c" />
              <stop offset="100%" stopColor="#1d2530" />
            </linearGradient>
          </defs>
          <path d="M10 20 L48 20 L43 66 Q42.6 68 40.6 68 H17.4 Q15.4 68 15 66 Z" fill="url(#td-bin)" stroke="#6fd3ff" strokeOpacity="0.35" strokeWidth="1.4" />
          <g stroke="#9fb2c6" strokeOpacity="0.35" strokeWidth="1.6">
            <path d="M21 28 L23 60 M29 28 L29 60 M37 28 L35 60" />
          </g>
          <g style={{ transformOrigin: "29px 18px", transform: bump ? "rotate(-22deg) translateY(-3px)" : "rotate(0deg)", transition: "transform .22s cubic-bezier(.2,1.5,.4,1)" }}>
            <path d="M6 18 L52 18 L49 11 Q48.4 9.6 46.8 9.6 H11.2 Q9.6 9.6 9 11 Z" fill="#55687d" stroke="#8fa6bd" strokeOpacity="0.5" strokeWidth="1.2" />
            <path d="M22 9.6 V6.4 Q22 5 23.6 5 H34.4 Q36 5 36 6.4 V9.6" fill="none" stroke="#8fa6bd" strokeOpacity="0.6" strokeWidth="2" />
          </g>
        </svg>
      </div>
      <div className="tnum display mt-0.5 text-[13px] leading-none text-ice/90">
        {count.toString().padStart(2, "0")}
      </div>
      <div className="text-[8px] tracking-[0.18em] text-chalk-dim/60 uppercase">corbeille</div>
    </div>
  );
}
