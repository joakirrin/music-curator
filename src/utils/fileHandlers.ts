// src/utils/fileHandlers.ts
// Utilities for CSV/JSON import-export + normalization (Spanish -> English)

import { Song, Platform } from "../types/song";

// ---- Constants

const EN_HEADERS: Array<keyof Omit<Song, "id" | "platforms" | "liked" | "toAdd"> | "platforms" | "liked" | "toAdd"> = [
  "title",
  "artist",
  "featuring",
  "album",
  "year",
  "producer",
  "platforms",
  "liked",
  "toAdd",
  "comments",
];

const ES_HEADERS = [
  "cancion",
  "artista",
  "fts",
  "album",
  "anio",
  "productor",
  "plataformas",
  "me_gusta",
  "agregar",
  "comentarios",
] as const;

const HEADER_MAP_ES_TO_EN: Record<(typeof ES_HEADERS)[number], (typeof EN_HEADERS)[number]> = {
  cancion: "title",
  artista: "artist",
  fts: "featuring",
  album: "album",
  anio: "year",
  productor: "producer",
  plataformas: "platforms",
  me_gusta: "liked",
  agregar: "toAdd",
  comentarios: "comments",
};

const ALLOWED_PLATFORMS: Platform[] = ["Spotify", "YouTube", "Bandcamp", "SoundCloud"];

// ---- Helpers

function coerceBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes" || s === "y";
  }
  return false;
}

function coerceString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v ?? "");
}

function coercePlatforms(v: unknown): Platform[] {
  if (Array.isArray(v)) {
    return v
      .map((p) => coerceString(p).trim())
      .filter(Boolean)
      .map(capitalizeExact)
      .filter((p): p is Platform => ALLOWED_PLATFORMS.includes(p as Platform));
  }
  if (typeof v === "string") {
    const parts = v.split(";").map((s) => s.trim()).filter(Boolean);
    return coercePlatforms(parts);
  }
  return [];
}

function capitalizeExact(s: string): string {
  // Keep exact tokens as allowed, simple normalization for common casings
  const candidates: Record<string, Platform> = {
    spotify: "Spotify",
    youtube: "YouTube",
    bandcamp: "Bandcamp",
    soundcloud: "SoundCloud",
  };
  const key = s.replace(/\s+/g, "").toLowerCase();
  return (candidates[key] as string) || s;
}

function generateId(): string {
  // Small, stable-enough ID generator (no deps)
  return "s_" + Math.random().toString(36).slice(2, 10);
}

// Standard CSV escaping for a single field
function csvEscape(field: string): string {
  const needsQuote = /[",\n]/.test(field);
  let out = field.replace(/"/g, '""');
  return needsQuote ? `"${out}"` : out;
}

// Minimal RFC4180 CSV parser (commas, double quotes, newlines)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(cell);
        cell = "";
      } else if (ch === "\n") {
        cur.push(cell);
        rows.push(cur);
        cur = [];
        cell = "";
      } else if (ch === "\r") {
        // ignore CR (handle CRLF)
        continue;
      } else {
        cell += ch;
      }
    }
  }
  // last cell
  cur.push(cell);
  rows.push(cur);
  // drop trailing empty row from final newline
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
    rows.pop();
  }
  return rows;
}

// ---- Normalization

/**
 * normalizeSong
 * Accepts English or Spanish keys (legacy), coerces to canonical English Song.
 * - Fills missing strings as ""
 * - Coerces booleans
 * - Ensures platforms is Platform[] of allowed values (ignores unknown strings)
 */
export function normalizeSong(input: unknown): Song {
  const raw = (typeof input === "object" && input != null ? input as Record<string, unknown> : {}) as Record<string, unknown>;

  // Map Spanish keys -> English keys into a working object
  const working: Record<string, unknown> = { ...raw };
  for (const [es, en] of Object.entries(HEADER_MAP_ES_TO_EN)) {
    if (es in working && !(en in working)) {
      working[en] = working[es];
    }
  }
  // Legacy boolean aliases (already covered by header map but keep defensive)
  if ("me_gusta" in working && !("liked" in working)) working["liked"] = working["me_gusta"];
  if ("agregar" in working && !("toAdd" in working)) working["toAdd"] = working["agregar"];
  if ("plataformas" in working && !("platforms" in working)) working["platforms"] = working["plataformas"];

  const song: Song = {
    id: coerceString(working.id) || generateId(),
    title: coerceString(working.title),
    artist: coerceString(working.artist),
    featuring: coerceString(working.featuring) || undefined,
    album: coerceString(working.album) || undefined,
    year: coerceString(working.year) || undefined,
    producer: coerceString(working.producer) || undefined,
    platforms: coercePlatforms(working.platforms),
    liked: coerceBoolean(working.liked),
    toAdd: coerceBoolean(working.toAdd),
    comments: coerceString(working.comments) || undefined,
  };

  // Ensure required strings at least "", for consistent UI (title/artist)
  if (!song.title) song.title = "";
  if (!song.artist) song.artist = "";

  return song;
}

// ---- CSV Export (always English canonical headers)

export function toCSV(songs: Song[]): string {
  const header = EN_HEADERS.join(",");
  const rows = songs.map((s) => {
    const fields: string[] = [
      csvEscape(s.title ?? ""),
      csvEscape(s.artist ?? ""),
      csvEscape(s.featuring ?? ""),
      csvEscape(s.album ?? ""),
      csvEscape(s.year ?? ""),
      csvEscape(s.producer ?? ""),
      csvEscape((s.platforms || []).join(";")),
      csvEscape(s.liked ? "1" : "0"),
      csvEscape(s.toAdd ? "1" : "0"),
      csvEscape(s.comments ?? ""),
    ];
    return fields.join(",");
  });
  return [header, ...rows].join("\n");
}

// ---- CSV Import (accept Spanish or English header row)

export function fromCSV(text: string): Song[] {
  const rows = parseCSV(text);
  if (!rows.length) return [];

  const headerRow = rows[0].map((h) => h.trim());
  const isEnglish = headerRow.length === EN_HEADERS.length && headerRow.every((h, i) => h === EN_HEADERS[i]);
  const isSpanish = headerRow.length === ES_HEADERS.length && headerRow.every((h, i) => h === ES_HEADERS[i]);

  let headerEn: string[] = [];
  if (isEnglish) {
    headerEn = [...EN_HEADERS];
  } else if (isSpanish) {
    headerEn = headerRow.map((h) => HEADER_MAP_ES_TO_EN[h as (typeof ES_HEADERS)[number]]);
  } else {
    throw new Error(
      "Unrecognized CSV headers. Expected English: " +
        EN_HEADERS.join(",") +
        " or Spanish: " +
        ES_HEADERS.join(",")
    );
  }

  const dataRows = rows.slice(1);
  const songs: Song[] = dataRows.map((cols) => {
    const rec: Record<string, unknown> = {};
    for (let i = 0; i < headerEn.length; i++) {
      const key = headerEn[i];
      rec[key] = cols[i] ?? "";
    }
    // liked/toAdd as "1"/"0"
    if ("liked" in rec) rec.liked = coerceBoolean(rec.liked);
    if ("toAdd" in rec) rec.toAdd = coerceBoolean(rec.toAdd);
    if ("platforms" in rec) rec.platforms = coercePlatforms(rec.platforms);
    return normalizeSong(rec);
  });

  return songs;
}

// ---- JSON Import (accept English or Spanish keys)

export function fromJSON(value: unknown): Song[] {
  const arr = Array.isArray(value) ? value : [];
  return arr.map((item) => normalizeSong(item));
}

// ---- Download helper (intact)

export function downloadFile(filename: string, content: string, mime: string = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
