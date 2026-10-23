import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { sfx } from "@/lib/audio";
import { randomFiles, type DunkFile } from "@/lib/files";

export type ResultKind = "swish" | "bank" | "lucky" | "rimout" | "airball";

export type ShotOutcome = {
  kind: ResultKind;
  made: boolean;
  delta: number;
  gauge: number;
  target: number;
  power: number;
  points: number;
  weak?: boolean;
};

export type Toast = {
  id: string;
  title: string;
  body: string;
  tone: "success" | "info" | "warn";
  app?: string;
};

export type Summary = {
  dunks: number;
  skipped: number;
  score: number;
  streak: number;
  swishes: number;
  durationSeconds?: number;
  isFreeMode?: boolean;
};

type Persisted = { totalDunks: number; bestStreak: number; sessions: number };

const STORE_KEY = "trashdunk.stats.v1";

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      return {
        totalDunks: p.totalDunks ?? 0,
        bestStreak: p.bestStreak ?? 0,
        sessions: p.sessions ?? 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { totalDunks: 0, bestStreak: 0, sessions: 0 };
};

type DunkCtx = {
  queue: DunkFile[];
  trashed: DunkFile[];
  skipped: number;
  score: number;
  streak: number;
  shots: number;
  swishes: number;
  airballs: number;
  persisted: Persisted;
  toasts: Toast[];
  summary: Summary | null;
  soundOn: boolean;
  pulse: number;
  addFiles: (files: DunkFile[]) => void;
  registerShot: (file: DunkFile, o: ShotOutcome) => void;
  skipActive: () => void;
  cancelSession: () => void;
  refill: (n?: number) => void;
  dismissSummary: () => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  toggleSound: () => void;
  isFreeMode?: boolean;
  requestEndSession?: () => void;
};

const Ctx = createContext<DunkCtx | null>(null);

let tid = 0;

export function DunkProvider({
  children,
  initialFiles,
  isFreeMode = false,
}: {
  children: ReactNode;
  initialFiles?: DunkFile[];
  isFreeMode?: boolean;
}) {
  const FREE_BALL_TEMPLATE: DunkFile = useMemo(
    () => ({ id: "free_ball_active", name: "Ballon d'entraînement", ext: "🏀", sizeKb: 0 }),
    []
  );

  const [queue, setQueue] = useState<DunkFile[]>(() =>
    isFreeMode
      ? [FREE_BALL_TEMPLATE]
      : initialFiles !== undefined
        ? initialFiles
        : typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
          ? []
          : randomFiles(5)
  );

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isFreeMode) {
      setQueue([FREE_BALL_TEMPLATE]);
      setSummary(null);
      inSessionRef.current = true;
      sessionRef.current = { dunks: 0, skipped: 0, swishes: 0, score: 0, best: 0 };
      startTimeRef.current = Date.now();
      setTrashed([]);
      setSkipped(0);
      setScore(0);
      setStreak(0);
      setShots(0);
      setSwishes(0);
      setAirballs(0);
    } else if (initialFiles !== undefined) {
      setQueue(initialFiles);
      setSummary(null);
      inSessionRef.current = true;
      sessionRef.current = { dunks: 0, skipped: 0, swishes: 0, score: 0, best: 0 };
      startTimeRef.current = Date.now();
      setTrashed([]);
      setSkipped(0);
      setScore(0);
      setStreak(0);
      setShots(0);
      setSwishes(0);
      setAirballs(0);
    }
  }, [initialFiles, isFreeMode, FREE_BALL_TEMPLATE]);
  const [trashed, setTrashed] = useState<DunkFile[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shots, setShots] = useState(0);
  const [swishes, setSwishes] = useState(0);
  const [airballs, setAirballs] = useState(0);
  const [persisted, setPersisted] = useState<Persisted>(() => loadPersisted());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [pulse, setPulse] = useState(0);

  const sessionRef = useRef({ dunks: 0, skipped: 0, swishes: 0, score: 0, best: 0 });
  const inSessionRef = useRef(true);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  useEffect(() => {
    sfx.setEnabled(soundOn);
  }, [soundOn]);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(persisted));
    } catch {
      /* ignore */
    }
  }, [persisted]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `t${++tid}`;
      setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismissToast(id), 5200);
    },
    [dismissToast]
  );

  const finishSession = useCallback(
    (mode: "complete" | "cancelled") => {
      const s = sessionRef.current;
      if (!inSessionRef.current) return;
      inSessionRef.current = false;
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      setPersisted((p) => ({
        totalDunks: p.totalDunks + s.dunks,
        bestStreak: Math.max(p.bestStreak, s.best),
        sessions: p.sessions + 1,
      }));
      if ((mode === "complete" || isFreeMode) && s.dunks + s.skipped > 0) {
        setSummary({
          dunks: s.dunks,
          skipped: s.skipped,
          score: s.score,
          streak: s.best,
          swishes: s.swishes,
          durationSeconds,
          isFreeMode,
        });
        pushToast({
          app: "TrashDunk",
          tone: "success",
          title: `Session terminée — ${s.dunks} ${isFreeMode ? "panier" : "fichier"}${s.dunks > 1 ? "s" : ""} dunké${s.dunks > 1 ? "s" : ""}`,
          body: `${s.score} pts · meilleur streak ${s.best} · ${s.swishes} swishs · ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        });
      } else {
        pushToast({
          app: "TrashDunk",
          tone: "warn",
          title: "Session terminée",
          body: isFreeMode ? "Entraînement terminé !" : "Rien n'a été déplacé. Vos fichiers sont toujours sur le disque.",
        });
      }
      sessionRef.current = { dunks: 0, skipped: 0, swishes: 0, score: 0, best: 0 };
      startTimeRef.current = Date.now();
      setTrashed([]);
      setSkipped(0);
      setScore(0);
      setStreak(0);
      setShots(0);
      setSwishes(0);
      setAirballs(0);
    },
    [pushToast, isFreeMode]
  );

  const startSessionIfNeeded = useCallback(() => {
    if (!inSessionRef.current) {
      inSessionRef.current = true;
      setSummary(null);
      sessionRef.current = { dunks: 0, skipped: 0, swishes: 0, score: 0, best: 0 };
      startTimeRef.current = Date.now();
      setTrashed([]);
      setSkipped(0);
      setScore(0);
      setStreak(0);
      setShots(0);
      setSwishes(0);
      setAirballs(0);
    }
  }, []);

  const addFiles = useCallback((files: DunkFile[]) => {
    if (!files.length) return;
    startSessionIfNeeded();
    startTimeRef.current = Date.now();
    setQueue((q) => [...q, ...files]);
    setPulse((p) => p + 1);
  }, [startSessionIfNeeded]);

  const refill = useCallback(
    (n = 5) => {
      startSessionIfNeeded();
      setQueue((q) => {
        if (q.length >= 25) {
          pushToast({
            app: "TrashDunk",
            tone: "info",
            title: "File pleine",
            body: "Vous avez déjà 25 fichiers en attente. Dunkez ou passez-les !",
          });
          return q;
        }
        const needed = Math.min(n, 25 - q.length);
        const exclude = q.map((f) => f.name);
        return [...q, ...randomFiles(needed, exclude)];
      });
      setPulse((p) => p + 1);
    },
    [startSessionIfNeeded, pushToast]
  );

  const registerShot = useCallback(
    (file: DunkFile, o: ShotOutcome) => {
      // Démarrer le chronomètre précisément au premier tir de la partie
      const s = sessionRef.current;
      if (s.dunks === 0 && s.skipped === 0 && s.score === 0) {
        startTimeRef.current = Date.now();
      }
      setShots((prev) => prev + 1);
      if (o.made) {
        const s = sessionRef.current;
        s.dunks += 1;
        s.score += o.points;
        s.swishes += o.kind === "swish" ? 1 : 0;
        const nextStreak = streak + 1;
        s.best = Math.max(s.best, nextStreak);
        setStreak(nextStreak);
        setScore((v) => v + o.points);
        if (o.kind === "swish") setSwishes((v) => v + 1);
        if (isFreeMode) {
          // En mode ballon illimité : le ballon ne disparaît jamais de la file, on en génère un nouveau
          setQueue([{ ...FREE_BALL_TEMPLATE, id: `free_${Date.now()}` }]);
        } else {
          setQueue((q) => q.filter((f) => f.id !== file.id));
        }
        setTrashed((t) => [...t, file]);
        setPersisted((p) => ({ ...p, bestStreak: Math.max(p.bestStreak, nextStreak) }));
      } else {
        setStreak(0);
        if (o.kind === "airball") setAirballs((v) => v + 1);
        if (!isFreeMode) {
          setQueue((q) => (q.length > 1 ? [...q.filter((f) => f.id !== file.id), file] : q));
        }
      }
    },
    [streak, isFreeMode, FREE_BALL_TEMPLATE]
  );

  const skipActive = useCallback(() => {
    const head = queueRef.current[0];
    if (!head) return;
    sessionRef.current.skipped += 1;
    setSkipped((v) => v + 1);
    setQueue((q) => q.slice(1));
    sfx.play("ui");
    pushToast({
      app: "TrashDunk",
      tone: "info",
      title: "Fichier renvoyé sur le disque",
      body: `${head.name}.${head.ext} reste à sa place.`,
    });
  }, [pushToast]);

  const cancelSession = useCallback(() => {
    setQueue([]);
    startTimeRef.current = Date.now();
    finishSession("cancelled");
  }, [finishSession]);

  const dismissSummary = useCallback(() => setSummary(null), []);

  const requestEndSession = useCallback(() => {
    finishSession("complete");
  }, [finishSession]);

  // SEUL temps mort du jeu : quand tous les tirs sont terminés
  // (file vide), on attend 3 s avant d'afficher le résumé de fin de session
  const prevLen = useRef(queue.length);
  useEffect(() => {
    if (!isFreeMode && prevLen.current > 0 && queue.length === 0 && inSessionRef.current) {
      const t = window.setTimeout(() => finishSession("complete"), 3000);
      return () => window.clearTimeout(t);
    }
    prevLen.current = queue.length;
  }, [queue.length, finishSession, isFreeMode]);

  const toggleSound = useCallback(() => setSoundOn((v) => !v), []);

  const value = useMemo<DunkCtx>(
    () => ({
      queue,
      trashed,
      skipped,
      score,
      streak,
      shots,
      swishes,
      airballs,
      persisted,
      toasts,
      summary,
      soundOn,
      pulse,
      addFiles,
      registerShot,
      skipActive,
      cancelSession,
      refill,
      dismissSummary,
      pushToast,
      dismissToast,
      toggleSound,
      isFreeMode,
      requestEndSession,
    }),
    [
      queue,
      trashed,
      skipped,
      score,
      streak,
      shots,
      swishes,
      airballs,
      persisted,
      toasts,
      summary,
      soundOn,
      pulse,
      addFiles,
      registerShot,
      skipActive,
      cancelSession,
      refill,
      dismissSummary,
      pushToast,
      dismissToast,
      toggleSound,
      isFreeMode,
      requestEndSession,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDunk() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDunk must be used inside DunkProvider");
  return c;
}

/** Points de base par palier, avant multiplicateur de combo. */
export const BASE_POINTS: Record<ResultKind, number> = {
  swish: 100,
  bank: 60,
  lucky: 40,
  rimout: 0,
  airball: 0,
};

export const comboMultiplier = (streak: number) =>
  streak >= 10 ? 5 : streak >= 7 ? 4 : streak >= 5 ? 3 : streak >= 3 ? 2 : 1;

export const RESULT_LABEL: Record<ResultKind, string> = {
  swish: "Swish",
  bank: "Panier",
  lucky: "Rebond gagnant",
  rimout: "Rebond raté",
  airball: "Air ball",
};
