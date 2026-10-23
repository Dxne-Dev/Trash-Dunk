import { useState } from "react";
import { sfx } from "@/lib/audio";
import { Reveal, SectionHead } from "./Chrome";

/* ---------- coloration syntaxique maison ---------- */
const KEYWORDS =
  /^(CREATE|TABLE|INDEX|ON|INTEGER|TEXT|REAL|PRIMARY|KEY|NOT|DEFAULT|CHECK|IN|public|static|void|using|if|else|return|class|string|true|false|null)$/;

const TOKEN_RE = /(\/\/[^\n]*|--[^\n]*|;[^\n]*)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

function Code({ text, lang }: { text: string; lang: "json" | "reg" | "sql" | "cs" }) {
  const lines = text.replace(/^\n/, "").split("\n");
  return (
    <pre className="overflow-x-auto px-4 py-4 text-[12px] leading-[1.65] sm:px-5 sm:text-[12.5px]">
      <code className="font-mono">
        {lines.map((ln, i) => {
          const nodes: React.ReactNode[] = [];
          let last = 0;
          let m: RegExpExecArray | null;
          TOKEN_RE.lastIndex = 0;
          const push = (s: string, cls: string, key: string) => {
            if (!s) return;
            nodes.push(
              <span key={key} className={cls}>
                {s}
              </span>
            );
          };
          while ((m = TOKEN_RE.exec(ln)) !== null) {
            push(ln.slice(last, m.index), "text-chalk/75", `p${i}-${m.index}`);
            const [full, comment, str, num, word] = m;
            const k = `t${i}-${m.index}`;
            if (comment) push(full, "text-arena-500 italic", k);
            else if (str) {
              const after = ln.slice(m.index + full.length).trimStart();
              const isKey = (lang === "json" || lang === "reg") && after.startsWith(":") ;
              push(full, isKey ? "text-ice" : "text-gold/90", k);
            } else if (num) push(full, "text-swish", k);
            else if (word && KEYWORDS.test(word)) push(full, "text-dunk-300 font-semibold", k);
            else push(full, "text-chalk/75", k);
            last = m.index + full.length;
          }
          push(ln.slice(last), "text-chalk/75", `e${i}`);
          return (
            <span key={i} className="block whitespace-pre">
              <span className="mr-4 inline-block w-5 text-right text-arena-600 select-none">{i + 1}</span>
              {nodes.length ? nodes : "\u00A0"}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

/* ---------- contenus ---------- */
const CONFIG = `
{
  "overlay":  { "topmost": true, "scale": 1.0, "escCancels": true, "showFps": false },
  "meter":    { "baseSpeed": 0.28, "powerScale": 0.62, "targetMin": 25, "targetMax": 90 },
  "tiers":    { "swish": 2, "bank": 8, "rim": 15, "rimIsCoinFlip": true },
  "scoring":  { "swish": 100, "bank": 60, "lucky": 40, "powerBonus": 0.65, "comboAt": [3, 5, 7, 10] },
  "audio":    { "enabled": true, "volume": 0.5, "engine": "WebAudio" },
  "shell":    { "verb": "Dunk it", "hotkey": "Ctrl+Shift+D", "multiSelect": true },
  "safety":   { "recycleBinOnly": true, "neverPermanent": true, "confirmOnFolders": true }
}`;

const REGISTRY = `
; Verbe shell ajouté au clic droit — additif, jamais substitué à « Supprimer »
[HKEY_CLASSES_ROOT\\*\\shell\\TrashDunk]
@                  = "Dunk it"
"Icon"             = "%ProgramFiles%\\TrashDunk\\TrashDunk.exe,0"
"Position"         = "Bottom"
"MultiSelectModel" = "Player"
"ExtendedSubCommandsKey" = ""

[HKEY_CLASSES_ROOT\\*\\shell\\TrashDunk\\command]
@ = "\\"%ProgramFiles%\\TrashDunk\\TrashDunk.exe\\" --dunk \\"%1\\""

; mêmes clés pour les dossiers et la sélection multiple
[HKEY_CLASSES_ROOT\\Directory\\shell\\TrashDunk]
[HKEY_CLASSES_ROOT\\AllFileSystemObjects\\shell\\TrashDunk]

; désinstallation propre : suppression des trois clés ci-dessus
; TrashDunk.Uninstall --remove-verb`;

const STATS = `
-- %appdata%\\TrashDunk\\stats.sqlite · écrit après chaque tir
CREATE TABLE shots (
  id          INTEGER PRIMARY KEY,
  file_path   TEXT    NOT NULL,
  file_bytes  INTEGER NOT NULL,
  target_pct  INTEGER NOT NULL,
  gauge_pct   INTEGER NOT NULL,
  delta       REAL    NOT NULL,
  power       REAL    NOT NULL,
  result      TEXT    NOT NULL CHECK(result IN ('swish','bank','lucky','rimout','airball')),
  points      INTEGER NOT NULL DEFAULT 0,
  streak      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_shots_result ON shots(result);
CREATE INDEX idx_shots_month  ON shots(substr(created_at, 1, 7));

-- 1 284 tirs · 61,3 % de réussite · record streak 17 · 402 swishs`;

const RS = `
// Un dunk réussi n'est JAMAIS une suppression définitive.
// src-tauri/src/lib.rs · Intégration Corbeille Windows native via trash-rs

#[tauri::command]
fn send_to_recycle_bin(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if p.exists() {
        trash::delete(p).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Tir manqué / Air ball : on ne touche à rien, le fichier reste 100% intact sur le bureau.
fn on_shot_miss(path: &str) {
    log::info!("Tir manqué : aucun fichier affecté pour {}", path);
}`;

const TABS = [
  { id: "config", label: "config.json", path: "%appdata%\\TrashDunk\\config.json", lang: "json" as const, code: CONFIG },
  { id: "reg", label: "Registre", path: "HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\TrashDunk", lang: "reg" as const, code: REGISTRY },
  { id: "rs", label: "lib.rs", path: "src-tauri\\src\\lib.rs", lang: "cs" as const, code: RS },
  { id: "sql", label: "stats.sqlite", path: "%appdata%\\TrashDunk\\stats.sqlite", lang: "sql" as const, code: STATS },
];

const STACK: Array<[string, string, string]> = [
  ["Architecture", "Tauri v2 + Rust", "Binaire natif x64, ultra-léger (~8 Mo), intégration système Windows sécurisée."],
  ["UI / Rendu", "React 19 + Tailwind", "Overlays transparents 60 FPS, Canvas 2D pour les particules, animations fluides."],
  ["Intégration Explorateur", "Menu contextuel Windows", "Verbe « Dunk it 🏀 » natif dans le registre HKCU. La corbeille Windows reste intacte."],
  ["Corbeille & Fichiers", "trash-rs (Win32 API)", "Envoi direct dans la vraie corbeille Windows via les API système natives, restaurable à tout moment."],
  ["Audio", "Web Audio API", "Swoosh, buzzer, filet, ambiance sonore synthétisée zéro-latence."],
  ["Processus & Tray", "System Tray & Single-Instance", "Veille silencieuse en barre des tâches sans saturer les ressources, gestion multi-fichiers."],
  ["Distribution", "Exécutable autonome", "Binaire Windows x64 prêt à l'emploi, sans runtime externe requis."],
];

export function SpecSheet() {
  const [tab, setTab] = useState(TABS[0].id);
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <section id="capot" className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <SectionHead
          index="05"
          eyebrow="Sous le capot"
          accent="#6fd3ff"
          title={
            <>
              Du Rust, du React
              <br />
              <span className="stroke-text">et l'API native de Windows.</span>
            </>
          }
        >
          <p className="text-[15px] leading-relaxed text-chalk-dim">
            Pas de moteur de jeu lourd, pas de service cloud, pas de télémétrie. Une fenêtre transparente Tauri, un verbe shell dans l'Explorateur et la vraie Corbeille Windows.
          </p>
        </SectionHead>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
        <Reveal className="overflow-hidden rounded-xl border border-arena-700/80 bg-arena-950">
          <div className="flex items-center gap-1 border-b border-arena-700/70 bg-arena-900/80 px-2 pt-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  sfx.play("ui");
                  setTab(t.id);
                }}
                className={`relative rounded-t-md px-3 py-2 text-[12px] font-medium transition ${
                  tab === t.id
                    ? "bg-arena-950 text-chalk"
                    : "text-chalk-dim/70 hover:bg-white/5 hover:text-chalk"
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-2 -top-px h-[2px] rounded-full bg-dunk-500" />}
              </button>
            ))}
            <span className="ml-auto hidden truncate px-3 font-mono text-[10.5px] text-arena-500 sm:block">
              {active.path}
            </span>
          </div>
          <div className="bg-arena-950">
            <Code key={active.id} text={active.code} lang={active.lang} />
          </div>
          <div className="flex items-center gap-2 border-t border-arena-800 bg-arena-900/60 px-4 py-2 text-[10.5px] text-arena-500">
            <span className="h-2 w-2 rounded-full bg-swish" />
            <span className="font-mono">lecture seule · extrait du projet</span>
          </div>
        </Reveal>

        <Reveal delay={90} className="overflow-hidden rounded-xl border border-arena-700/80 bg-arena-900/50">
          <div className="flex items-center justify-between border-b border-arena-700/70 bg-arena-850/60 px-4 py-3">
            <span className="display text-[19px] tracking-wide text-chalk">Stack technique</span>
            <span className="text-[10px] tracking-[0.18em] text-chalk-dim/60 uppercase">doc de définition</span>
          </div>
          <div className="divide-y divide-arena-800/80">
            {STACK.map(([k, v, why]) => (
              <div key={k} className="group px-4 py-3 transition-colors hover:bg-arena-850/70">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[10.5px] font-semibold tracking-[0.16em] text-chalk-dim/65 uppercase">{k}</span>
                  <span className="display text-[21px] leading-none text-dunk-400 transition-colors group-hover:text-dunk-300">
                    {v}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-chalk-dim/90">{why}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
