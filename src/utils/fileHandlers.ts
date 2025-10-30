import { Song, Platform } from '../types/song';

const CSV_HEADERS = ['cancion','artista','fts','album','anio','productor','plataformas','me_gusta','agregar','comentarios'] as const;

const escapeCSV = (value: string) => {
  const v = value ?? '';
  if (/[",\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
};

/** Export songs to CSV following the contract:
 * columnas: cancion,artista,fts,album,anio,productor,plataformas,me_gusta,agregar,comentarios
 * plataformas joined by ';'
 * me_gusta/agregar as 1/0
 * Note: we intentionally do NOT include internal id in CSV.
 */
export const toCSV = (songs: Song[]): string => {
  const lines = [CSV_HEADERS.join(',')];
  for (const s of songs) {
    const row = [
      s.cancion || '',
      s.artista || '',
      s.fts || '',
      s.album || '',
      s.anio || '',
      s.productor || '',
      (s.plataformas || []).join(';'),
      s.me_gusta ? '1' : '0',
      s.agregar ? '1' : '0',
      s.comentarios || '',
    ];
    lines.push(row.map(escapeCSV).join(','));
  }
  return lines.join('\n');
};

// tiny CSV parser that supports quotes and commas/newlines in fields
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let i = 0, cur = '', inQuotes = false;
  const pushCell = (row: string[]) => { row.push(cur); cur = ''; };
  let row: string[] = [];
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { cur += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      } else { cur += ch; i++; continue; }
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { pushCell(row); i++; continue; }
      if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i+1] === '\n') i++;
        pushCell(row);
        rows.push(row);
        row = [];
        i++;
        continue;
      }
      cur += ch; i++; continue;
    }
  }
  // flush last cell/row
  pushCell(row);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
};

const asPlatform = (s: string): Platform | null => {
  const v = (s || '').trim();
  if (!v) return null;
  if (v === 'Spotify' || v === 'YouTube' || v === 'Bandcamp' || v === 'SoundCloud') return v as Platform;
  return null;
};

export const fromCSV = (csvText: string): Song[] => {
  const rows = parseCSV(csvText.trim());
  if (rows.length === 0) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  const start = header[0] === CSV_HEADERS[0] ? 1 : 0;

  const idx: Record<string, number> = {};
  CSV_HEADERS.forEach(h => {
    const j = header.indexOf(h);
    idx[h] = j;
  });

  const out: Song[] = [];
  for (let r = start; r < rows.length; r++) {
    const cells = rows[r];
    const cell = (name: typeof CSV_HEADERS[number]) => {
      const j = idx[name];
      return j >= 0 ? (cells[j] ?? '').trim() : '';
    };
    const plataformasRaw = cell('plataformas');
    const plataformas = plataformasRaw
      ? (plataformasRaw.split(';').map(s => asPlatform(s)).filter(Boolean) as Platform[])
      : [];
    const parseBool = (v: string) => v === '1' || /^true$/i.test(v);

    const song: Song = {
      id: crypto.randomUUID(),
      cancion: cell('cancion'),
      artista: cell('artista'),
      fts: cell('fts'),
      album: cell('album'),
      anio: cell('anio'),
      productor: cell('productor'),
      plataformas,
      me_gusta: parseBool(cell('me_gusta')),
      agregar: parseBool(cell('agregar')),
      comentarios: cell('comentarios'),
    };
    out.push(song);
  }
  return out;
};

export const downloadFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
