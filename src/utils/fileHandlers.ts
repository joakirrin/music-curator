// src/utils/fileHandlers.ts
// Utilities for CSV/JSON import-export + normalization (Spanish -> English)

import type { Song, Platform } from "../types";

// ---- Canonical headers (English, export order)
// ---- Canonical headers (English, export order)
const EN_HEADERS = [
  'title',
  'artist',
  'featuring',
  'album',
  'year',
  'producer',
  'platforms',
  'liked',
  'toAdd',
  'comments',
] as const;


// Spanish -> English header map (legacy import)
const HEADER_MAP_ES_TO_EN: Record<string, keyof Song> = {
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

const ALLOWED_PLATFORMS: Platform[] = [
  "Spotify",
  "YouTube",
  "Bandcamp",
  "SoundCloud",
];

// ---- Helpers

function generateId(): string {
  return `song_${Math.random().toString(36).slice(2, 10)}`;
}

function coerceString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v ?? "").trim();
}

function coerceBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = coerceString(v).toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return false;
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
    const parts = v
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    return coercePlatforms(parts);
  }
  return [];
}

function capitalizeExact(s: string): string {
  // normalize most common casings to canonical
  const t = s.trim().toLowerCase();
  if (t === "spotify") return "Spotify";
  if (t === "youtube") return "YouTube";
  if (t === "bandcamp") return "Bandcamp";
  if (t === "soundcloud") return "SoundCloud";
  return s;
}

// ---- Public API

/**
 * normalizeSong(input: unknown): Song
 * - Accepts English or Spanish keys.
 * - Coerces booleans, normalizes platforms.
 * - Unknown platform strings are ignored.
 * - Missing strings -> "" (optional fields may remain undefined if empty).
 */
export function normalizeSong(input: unknown): Song {
  const raw = (input ?? {}) as Record<string, unknown>;

  // Copy in case it's a class / prototype, and lift Spanish keys into English
  const working: Record<string, unknown> = { ...raw };
  for (const [es, en] of Object.entries(HEADER_MAP_ES_TO_EN)) {
    if (es in working && !(en in working)) {
      working[en] = working[es];
    }
  }
  // Defensive legacy aliases (already covered above, but safe)
  if ("me_gusta" in working && !("liked" in working))
    working["liked"] = working["me_gusta"];
  if ("agregar" in working && !("toAdd" in working))
    working["toAdd"] = working["agregar"];
  if ("plataformas" in working && !("platforms" in working))
    working["platforms"] = working["plataformas"];

  const title = coerceString(working.title);
  const artist = coerceString(working.artist);
  const featuring = coerceString(working.featuring) || undefined;
  const album = coerceString(working.album) || undefined;
  const year = coerceString(working.year) || undefined;
  const producer = coerceString(working.producer) || undefined;
  const platforms = coercePlatforms(working.platforms);
  const liked = coerceBool(working.liked);
  const toAdd = coerceBool(working.toAdd);
  const comments = coerceString(working.comments) || undefined;

  const id = coerceString((working as any).id) || generateId();

  return {
    id,
    title,
    artist,
    featuring,
    album,
    year,
    producer,
    platforms,
    liked,
    toAdd,
    comments,
  };
}

// ---- CSV Parsing

// Small CSV parser (quotes + commas), no new deps
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    cur.push(cell);
    cell = "";
  };
  const pushRow = () => {
    rows.push(cur);
    cur = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushCell();
    } else if (ch === "\n" || ch === "\r") {
      // handle \r\n, \n, \r
      // finalize row only if we have something (skip stray empty lines)
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushCell();
      if (cur.length > 1 || cur[0] !== "") pushRow();
    } else {
      cell += ch;
    }
  }
  // tail
  pushCell();
  if (cur.length > 1 || cur[0] !== "") pushRow();

  return rows;
}

function csvEscape(s: string): string {
  const needs = /[",\n\r]/.test(s);
  let out = s.replace(/"/g, '""');
  return needs ? `"${out}"` : out;
}

/**
 * fromCSV(text): Song[]
 * - Detects Spanish or English header row.
 * - If Spanish, maps to English.
 * - If not recognized, throws a friendly error.
 */
export function fromCSV(text: string): Song[] {
  const rows = parseCSV(text.trim());
  if (!rows.length) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const isEnglish = EN_HEADERS.some((h) => header.includes(h.toLowerCase()));
  const esKeys = Object.keys(HEADER_MAP_ES_TO_EN);
  const isSpanish = esKeys.some((es) => header.includes(es.toLowerCase()));

  let headerToUse: string[] = [];
  if (isEnglish || isSpanish) {
    // map Spanish columns to English names for internal handling
    headerToUse = rows[0].map((h) => {
      const normalized = h.trim().toLowerCase();
      return (HEADER_MAP_ES_TO_EN[normalized] ?? h.trim()) as string;
    });
  } else {
    throw new Error(
      "Unrecognized CSV headers. Expect English (title,artist,...) or Spanish legacy (cancion,artista,...)."
    );
  }

  const dataRows = rows.slice(1);
  const songs: Song[] = [];

  for (const r of dataRows) {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < r.length; i++) {
      const key = headerToUse[i];
      const val = r[i];
      if (!key) continue;

      if (key === "platforms") {
        obj.platforms = val;
      } else if (key === "liked" || key === "toAdd") {
        obj[key] = val === "1" || val.toLowerCase() === "true";
      } else {
        obj[key] = val;
      }
    }
    songs.push(normalizeSong(obj));
  }

  return songs;
}

/**
 * parseSongsFromCsv - Alias for fromCSV for backward compatibility
 */
export function parseSongsFromCsv(text: string): Song[] {
  return fromCSV(text);
}

/**
 * toCSV(songs): string
 * - Always English headers, canonical order.
 * - platforms joined with ';'
 * - booleans as "1"/"0"
 */
export function toCSV(songs: Song[]): string {
  const header = EN_HEADERS.join(",");
  const lines = [header];

  for (const s of songs) {
    const rowVals = EN_HEADERS.map((k) => {
      const v = (s as any)[k];
      if (k === "platforms") {
        return csvEscape((v as Platform[]).join(";"));
      }
      if (k === "liked" || k === "toAdd") {
        return (v ? "1" : "0") as string;
      }
      return csvEscape(v ?? "");
    });
    lines.push(rowVals.join(","));
  }

  return lines.join("\n");
}

/**
 * exportSongsToCsv - Alias for toCSV for backward compatibility
 */
export function exportSongsToCsv(songs: Song[]): string {
  return toCSV(songs);
}

/**
 * fromJSON(value): Song[]
 * - Accepts array of objects with either English or Spanish keys.
 * - Normalizes via normalizeSong.
 */
export function fromJSON(value: unknown): Song[] {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return fromJSON(parsed);
    } catch {
      throw new Error("Invalid JSON content.");
    }
  }
  if (!Array.isArray(value)) {
    throw new Error("JSON must be an array of songs.");
  }
  return value.map(normalizeSong);
}

/**
 * parseSongsFromJson - Alias for fromJSON for backward compatibility
 */
export function parseSongsFromJson(value: unknown): Song[] {
  return fromJSON(value);
}

/**
 * exportSongsToJson - Convert songs array to JSON string
 */
export function exportSongsToJson(songs: Song[]): string {
  return JSON.stringify(songs, null, 2);
}

/**
 * Download helper - Creates a downloadable file from content
 */
export function downloadFile(
  filename: string,
  content: string,
  mime: string = "text/plain;charset=utf-8"
): void {
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