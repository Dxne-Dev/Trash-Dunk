export type DunkFile = {
  id: string;
  name: string;
  ext: string;
  sizeKb: number;
};

export type ExtMeta = { label: string; fg: string; bg: string };

export const EXT_META: Record<string, ExtMeta> = {
  docx: { label: "DOC", fg: "#eaf1ff", bg: "#2b579a" },
  pdf: { label: "PDF", fg: "#ffeaea", bg: "#b8323c" },
  xlsx: { label: "XLS", fg: "#e9fff1", bg: "#1f7144" },
  pptx: { label: "PPT", fg: "#fff1e8", bg: "#c4441c" },
  png: { label: "PNG", fg: "#f2ebff", bg: "#7a4bbd" },
  jpg: { label: "JPG", fg: "#fff4e3", bg: "#b5811f" },
  psd: { label: "PSD", fg: "#e6f7ff", bg: "#1d6f96" },
  mp4: { label: "MP4", fg: "#ffe9f3", bg: "#a63268" },
  zip: { label: "ZIP", fg: "#fff8e0", bg: "#8a6a12" },
  exe: { label: "EXE", fg: "#e9fbff", bg: "#2a6f7d" },
  mp3: { label: "MP3", fg: "#ffece6", bg: "#c25a2b" },
  ts: { label: "TS", fg: "#e8f4ff", bg: "#2f74c0" },
  json: { label: "{}", fg: "#f6f1e2", bg: "#6c6142" },
  tmp: { label: "TMP", fg: "#eef0f2", bg: "#5a6470" },
  iso: { label: "ISO", fg: "#e8fff4", bg: "#2c7a5b" },
  log: { label: "LOG", fg: "#f0f0f0", bg: "#4c4c58" },
};

export const extMeta = (ext: string): ExtMeta =>
  EXT_META[ext.toLowerCase()] ?? { label: "FIL", fg: "#f0f0f0", bg: "#5a6470" };

let counter = 0;
export const uid = () => `f${Date.now().toString(36)}${(counter++).toString(36)}`;

export const makeFile = (name: string, ext: string, sizeKb: number): DunkFile => ({
  id: uid(),
  name,
  ext,
  sizeKb,
});

export const formatSize = (kb: number) =>
  kb >= 1048576 ? `${(kb / 1048576).toFixed(1)} Go` : kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${kb} Ko`;

/** Bibliothèque de fichiers "réalistes" pour la démo. */
export const FILE_LIBRARY: Array<[string, string, number]> = [
  ["rapport_final_v12_DEFINITIF", "docx", 842],
  ["Copie de Copie de budget_2024", "xlsx", 316],
  ["photo_VACANCES_plage_raw_04217", "jpg", 8421],
  ["Screen Recording 2024-11-03", "mp4", 486320],
  ["node_modules_backup", "zip", 251904],
  ["Présentation_client_FINALE_v3", "pptx", 15320],
  ["scan_contrat_signé", "pdf", 2214],
  ["CV_moi_2019_ne_pas_jeter", "docx", 96],
  ["mix_master_take17_final_final", "mp3", 9840],
  ["PSD_logo_vectorisé_non_écrasé", "psd", 128400],
  ["todo_list_provisoire", "json", 4],
  ["debug_output_console", "log", 18230],
  ["Windows_11_ISO_fr-fr", "iso", 5421000],
  ["installeur_obsolete_2011", "exe", 41200],
  ["thumbnail_cache_9f2b", "tmp", 12],
  ["utils", "ts", 27],
  ["MOT_DE_PASSE_copie_locale", "docx", 3],
  ["capture_ecran_2023-04-11_093412", "png", 1440],
  ["montage_anniversaire_export", "mp4", 918400],
  ["archive_projet_terminé_2019", "zip", 342100],
  ["facture_fournisseur_00217", "pdf", 188],
  ["playlist_soiree_à_trier", "mp3", 7310],
  ["sauvegarde_JEU_SLOT2", "iso", 1204000],
  ["notes_vrac_idées_en_vrac", "docx", 61],
];

export const randomFiles = (n: number, exclude: string[] = []): DunkFile[] => {
  const pool = FILE_LIBRARY.filter(([name]) => !exclude.includes(name));
  const out: DunkFile[] = [];
  const used = new Set<number>();
  let guard = 0;
  while (out.length < n && guard++ < 400) {
    const i = Math.floor(Math.random() * pool.length);
    if (used.has(i)) continue;
    used.add(i);
    const [name, ext, sizeKb] = pool[i];
    out.push(makeFile(name, ext, sizeKb));
  }
  return out;
};

export const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
};
