import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "@/lib/audio";
import { extMeta, formatSize, makeFile, type DunkFile } from "@/lib/files";
import { useDunk } from "@/state/dunk";

type Row = { id: string; name: string; ext: string; sizeKb: number; date: string };

const ROWS: Row[] = [
  ["rapport_final_v12_DEFINITIF", "docx", 842, "03/11/2024 18:42"],
  ["Copie de Copie de budget_2024", "xlsx", 316, "28/10/2024 09:15"],
  ["photo_VACANCES_plage_raw_04217", "jpg", 8421, "14/08/2024 12:03"],
  ["Screen Recording 2024-11-03", "mp4", 486320, "03/11/2024 21:07"],
  ["node_modules_backup", "zip", 251904, "17/09/2024 02:31"],
  ["Présentation_client_FINALE_v3", "pptx", 15320, "30/10/2024 17:58"],
  ["scan_contrat_signé", "pdf", 2214, "22/10/2024 11:24"],
  ["CV_moi_2019_ne_pas_jeter", "docx", 96, "05/01/2019 20:11"],
  ["mix_master_take17_final_final", "mp3", 9840, "19/10/2024 23:47"],
  ["PSD_logo_vectorisé_non_écrasé", "psd", 128400, "02/06/2023 15:36"],
  ["thumbnail_cache_9f2b", "tmp", 12, "04/11/2024 07:02"],
  ["Windows_11_ISO_fr-fr", "iso", 5421000, "11/07/2024 10:44"],
  ["installeur_obsolete_2011", "exe", 41200, "03/02/2011 16:20"],
  ["MOT_DE_PASSE_copie_locale", "docx", 3, "29/10/2024 22:36"],
].map(([name, ext, sizeKb, date]) => ({ id: name as string, name: name as string, ext: ext as string, sizeKb: sizeKb as number, date: date as string }));

const SIDEBAR: Array<[string, string]> = [
  ["Bureau", "desk"],
  ["Téléchargements", "down"],
  ["Documents", "doc"],
  ["Images", "img"],
  ["Corbeille", "bin"],
];

export function ExplorerDemo() {
  const { addFiles, queue, trashed, pushToast } = useDunk();
  const [selected, setSelected] = useState<Set<string>>(new Set([ROWS[0].id]));
  const [menu, setMenu] = useState<{ x: number; y: number; files: Row[] } | null>(null);
  const [hintOn, setHintOn] = useState(true);
  const [lastIdx, setLastIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const atPlay = useMemo(() => new Set(queue.map((f) => f.name)), [queue]);
  const inBin = useMemo(() => new Set(trashed.map((f) => f.name)), [trashed]);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-ctx]")) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu, close]);

  const selectRow = (i: number, e: React.MouseEvent) => {
    const id = ROWS[i].id;
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.ctrlKey || e.metaKey) {
        next.has(id) ? next.delete(id) : next.add(id);
      } else if (e.shiftKey) {
        const [a, b] = [Math.min(i, lastIdx), Math.max(i, lastIdx)];
        for (let k = a; k <= b; k++) next.add(ROWS[k].id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
    setLastIdx(i);
    sfx.play("ui");
  };

  const openMenu = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    const id = ROWS[i].id;
    let files: Row[];
    if (selected.has(id) && selected.size > 1) {
      files = ROWS.filter((r) => selected.has(r.id));
    } else {
      files = [ROWS[i]];
      setSelected(new Set([id]));
      setLastIdx(i);
    }
    setHintOn(false);
    sfx.unlock();
    sfx.play("ui");
    const wrap = wrapRef.current?.getBoundingClientRect();
    const mw = 250;
    const mh = files.length > 1 ? 300 : 380;
    const x = wrap ? Math.min(e.clientX - wrap.left, wrap.width - mw - 8) : 40;
    const y = wrap ? Math.min(e.clientY - wrap.top, wrap.height - mh - 8) : 40;
    setMenu({ x: Math.max(6, x), y: Math.max(6, y), files });
  };

  const dunk = () => {
    if (!menu) return;
    const files: DunkFile[] = menu.files.map((r) => makeFile(r.name, r.ext, r.sizeKb));
    addFiles(files);
    sfx.play("grab");
    pushToast({
      app: "TrashDunk",
      tone: "info",
      title: files.length > 1 ? `${files.length} fichiers envoyés au terrain` : "Fichier envoyé au terrain",
      body: files.length > 1 ? "Chaîne de dunks : un ballon par fichier." : `${files[0].name}.${files[0].ext} devient un ballon.`,
    });
    setMenu(null);
    document.querySelector("#dunker")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const selCount = selected.size;

  return (
    <div className="relative" ref={wrapRef}>
      {/* fenêtre */}
      <div className="overflow-hidden rounded-xl border border-arena-600/80 bg-[#1c2430] shadow-[0_44px_100px_-30px_rgba(0,0,0,.9)]">
        {/* barre de titre + onglet */}
        <div className="flex items-center gap-2 border-b border-black/40 bg-[#202a37] px-2 pt-2">
          <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-white/10 bg-[#2b3543] px-3 py-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f6c453" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="M8 20h8" />
            </svg>
            <span className="text-[12px] font-medium text-chalk/90">Bureau</span>
            <span className="text-[13px] text-chalk-dim/60">+</span>
          </div>
          <div className="ml-auto flex items-center gap-0.5 pb-1">
            {["—", "□", "✕"].map((g, i) => (
              <span
                key={g}
                className={`grid h-7 w-9 place-items-center text-[11px] text-chalk-dim/80 ${i === 2 ? "hover:bg-[#c42b1c] hover:text-white" : "hover:bg-white/10"}`}
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* barre d'adresse */}
        <div className="flex items-center gap-2 border-b border-black/30 bg-[#26303d] px-2 py-1.5">
          <div className="flex gap-0.5 text-chalk-dim/70">
            {["‹", "›", "↑"].map((a) => (
              <span key={a} className="grid h-7 w-7 place-items-center rounded text-[13px] hover:bg-white/10">
                {a}
              </span>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-white/10 bg-[#1e2733] px-2 py-1 text-[12px] text-chalk/85">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6c453" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2" />
            </svg>
            <span className="truncate">
              Ce PC <span className="text-chalk-dim/50">›</span> Utilisateurs <span className="text-chalk-dim/50">›</span> vous{" "}
              <span className="text-chalk-dim/50">›</span> <b className="font-semibold">Bureau</b>
            </span>
          </div>
          <div className="hidden items-center gap-1.5 rounded border border-white/10 bg-[#1e2733] px-2 py-1 text-[12px] text-chalk-dim/70 sm:flex">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            Rechercher
          </div>
        </div>

        <div className="flex">
          {/* volet de navigation */}
          <div className="hidden w-[168px] shrink-0 border-r border-black/25 bg-[#1f2835] py-2 sm:block">
            {SIDEBAR.map(([label, kind], i) => {
              const isBin = kind === "bin";
              return (
                <div
                  key={label}
                  className={`mx-1 flex items-center gap-2 rounded px-2 py-1.5 text-[12.5px] ${
                    i === 0 ? "bg-white/10 text-chalk" : "text-chalk-dim/85 hover:bg-white/5"
                  }`}
                >
                  <SideIcon kind={kind} count={isBin ? trashed.length : undefined} />
                  <span className="truncate">{label}</span>
                  {isBin && trashed.length > 0 && (
                    <span className="tnum ml-auto rounded-full bg-ice/20 px-1.5 text-[10px] font-bold text-ice">
                      {trashed.length}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="mt-3 border-t border-white/10 px-3 pt-3">
              <div className="text-[10px] tracking-[0.16em] text-chalk-dim/50 uppercase">Verbes shell</div>
              <div className="mt-1.5 flex items-center gap-1.5 rounded bg-dunk-600/25 px-2 py-1.5 ring-1 ring-dunk-500/40">
                <span className="text-[12px]">🏀</span>
                <span className="text-[11.5px] font-semibold text-dunk-300">Dunk it</span>
              </div>
              <div className="mt-1 px-2 text-[10px] text-chalk-dim/50">Ctrl + Maj + D</div>
            </div>
          </div>

          {/* liste de fichiers */}
          <div className="min-w-0 flex-1 bg-[#212a37]">
            <div className="grid grid-cols-[minmax(0,1fr)_92px_78px] gap-2 border-b border-black/25 px-3 py-1.5 text-[11px] font-semibold text-chalk-dim/65 sm:grid-cols-[minmax(0,1fr)_120px_92px_78px]">
              <span>Nom</span>
              <span className="hidden sm:block">Date de modification</span>
              <span className="text-right">Taille</span>
              <span className="text-right">État</span>
            </div>

            <div className="max-h-[430px] overflow-y-auto py-1">
              {ROWS.map((r, i) => {
                const m = extMeta(r.ext);
                const isSel = selected.has(r.id);
                const playing = atPlay.has(r.name);
                const binned = inBin.has(r.name);
                return (
                  <div
                    key={r.id}
                    onClick={(e) => selectRow(i, e)}
                    onContextMenu={(e) => openMenu(i, e)}
                    onDoubleClick={() => {
                      sfx.play("error");
                      pushToast({
                        tone: "warn",
                        app: "Windows",
                        title: "Ouverture impossible",
                        body: "Ceci est une maquette de démonstration — mais le clic droit, lui, fonctionne.",
                      });
                    }}
                    className={`group grid cursor-default grid-cols-[minmax(0,1fr)_92px_78px] items-center gap-2 px-3 py-[7px] text-[12.5px] transition-colors sm:grid-cols-[minmax(0,1fr)_120px_92px_78px] ${
                      isSel ? "bg-[#3a4a61] text-chalk" : "text-chalk/85 hover:bg-white/[0.06]"
                    } ${binned ? "opacity-45" : ""}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileGlyph label={m.label} bg={m.bg} fg={m.fg} />
                      <span className={`truncate ${binned ? "line-through" : ""}`}>
                        {r.name}
                        <span className="text-chalk-dim/55">.{r.ext}</span>
                      </span>
                      {playing && (
                        <span className="ml-1 shrink-0 animate-pulse rounded-full bg-dunk-500/25 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-dunk-300 uppercase ring-1 ring-dunk-500/50">
                          au terrain
                        </span>
                      )}
                      {i === 0 && hintOn && (
                        <span className="ml-1 hidden shrink-0 items-center gap-1 rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-[9.5px] font-bold tracking-wide text-gold uppercase md:inline-flex">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.8 5.5 21l2-7.5L2 9h7z" />
                          </svg>
                          clic droit ici
                        </span>
                      )}
                    </span>
                    <span className="hidden text-[11.5px] text-chalk-dim/60 sm:block">{r.date}</span>
                    <span className="tnum text-right text-[11.5px] text-chalk-dim/70">{formatSize(r.sizeKb)}</span>
                    <span className="text-right text-[11px]">
                      {binned ? (
                        <span className="font-semibold text-ice">corbeille</span>
                      ) : playing ? (
                        <span className="font-semibold text-dunk-400">en jeu</span>
                      ) : (
                        <span className="text-chalk-dim/45">—</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 border-t border-black/25 bg-[#1e2733] px-3 py-1.5 text-[11px] text-chalk-dim/70">
              <span className="tnum">{ROWS.length} éléments</span>
              {selCount > 0 && <span className="tnum text-chalk">{selCount} sélectionné{selCount > 1 ? "s" : ""}</span>}
              <button
                onClick={() => {
                  const files = ROWS.filter((r) => selected.has(r.id)).map((r) => makeFile(r.name, r.ext, r.sizeKb));
                  if (!files.length) return;
                  sfx.play("grab");
                  addFiles(files);
                  document.querySelector("#dunker")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="ml-auto flex items-center gap-1.5 rounded bg-dunk-500 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-dunk-400 active:scale-95"
              >
                🏀 Dunk it
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* menu contextuel */}
      {menu && (
        <div
          data-ctx
          className="anim-pop absolute z-30 w-[250px] overflow-hidden rounded-lg border border-white/12 bg-[#2b3442]/97 shadow-[0_26px_60px_-12px_rgba(0,0,0,.9)] backdrop-blur-xl"
          style={{ left: menu.x, top: menu.y }}
        >
          <div className="flex items-center justify-around border-b border-white/10 px-2 py-2">
            {["cut", "copy", "rename", "share", "del"].map((k) => (
              <span key={k} className="grid h-7 w-9 place-items-center rounded text-chalk-dim/85 hover:bg-white/10">
                <CtxIcon k={k} />
              </span>
            ))}
          </div>

          <CtxItem label="Ouvrir" hint="Entrée" />
          <CtxItem label="Ouvrir avec" chev />
          <CtxItem label="Partager" />
          <div className="my-1 h-px bg-white/10" />

          <button
            onClick={dunk}
            className="group relative flex w-full items-center gap-2.5 bg-dunk-600/22 px-3 py-2.5 text-left transition hover:bg-dunk-600/40"
          >
            <span className="absolute inset-y-0 left-0 w-[3px] bg-dunk-500" />
            <span className="grid h-5 w-5 shrink-0 place-items-center">
              <svg width="17" height="17" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="#ef6528" />
                <g stroke="#43150a" strokeWidth="1.8" fill="none">
                  <path d="M20 4v32M4 20h32M8.6 8.6q11.4 11.4 0 22.8M31.4 8.6q-11.4 11.4 0 22.8" />
                </g>
              </svg>
            </span>
            <span className="text-[13px] font-bold text-chalk">
              Dunk it{menu.files.length > 1 ? ` (${menu.files.length})` : ""}
            </span>
            <span className="ml-auto text-[10.5px] text-chalk-dim/70">Ctrl+Maj+D</span>
          </button>

          <div className="my-1 h-px bg-white/10" />
          <CtxItem label="Copier en tant que chemin d'accès" />
          <CtxItem label="Compresser dans un fichier ZIP" />
          <CtxItem label="Restaurer les versions précédentes" />
          <div className="my-1 h-px bg-white/10" />
          <CtxItem label="Supprimer" hint="Suppr" muted />
          <CtxItem label="Propriétés" />
        </div>
      )}
    </div>
  );
}

/* ---------- petits morceaux ---------- */

function CtxItem({
  label,
  hint,
  chev,
  muted,
}: {
  label: string;
  hint?: string;
  chev?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      onClick={() => sfx.play("ui")}
      className={`flex w-full items-center gap-2.5 px-3 py-[7px] text-left text-[12.5px] transition hover:bg-white/10 ${
        muted ? "text-chalk-dim/70" : "text-chalk/90"
      }`}
    >
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-[10.5px] text-chalk-dim/60">{hint}</span>}
      {chev && <span className="text-[10px] text-chalk-dim/60">›</span>}
    </button>
  );
}

function CtxIcon({ k }: { k: string }) {
  const p: Record<string, string> = {
    cut: "M6 4l12 16M18 4L6 20M9 20h9",
    copy: "M9 9h10v10H9zM5 15V5h10",
    rename: "M4 20h16M6 16l9-9 3 3-9 9H6z",
    share: "M12 4v12M8 8l4-4 4 4M5 14v6h14v-6",
    del: "M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13",
  };
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={p[k]} />
    </svg>
  );
}

function FileGlyph({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      className="grid h-[18px] w-[15px] shrink-0 place-items-center rounded-[2px] text-[7.5px] leading-none font-bold"
      style={{ background: bg, color: fg, boxShadow: "inset 0 -6px 8px rgba(0,0,0,.25)" }}
    >
      {label}
    </span>
  );
}

function SideIcon({ kind, count }: { kind: string; count?: number }) {
  if (kind === "bin")
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={count ? "#6fd3ff" : "#93a3b5"} strokeWidth="1.7">
        <path d="M4 7h16l-1.4 13H5.4z" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  if (kind === "down")
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93a3b5" strokeWidth="1.7">
        <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
      </svg>
    );
  if (kind === "img")
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93a3b5" strokeWidth="1.7">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M4 17l5-4 4 3 3-2 4 3" />
      </svg>
    );
  if (kind === "doc")
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93a3b5" strokeWidth="1.7">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
      </svg>
    );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f6c453" strokeWidth="1.7">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 20h8" />
    </svg>
  );
}
