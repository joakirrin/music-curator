import { Song, Platform } from '../types/song';

export const toCSV = (songs: Song[]): string => {
  if (songs.length === 0) return '';

  const headers = ['id', 'cancion', 'artista', 'fts', 'album', 'anio', 'productor', 'plataformas', 'me_gusta', 'agregar', 'comentarios'];
  const rows = songs.map(song => [
    song.id,
    song.cancion,
    song.artista,
    song.fts,
    song.album,
    song.anio,
    song.productor,
    song.plataformas.join('|'),
    song.me_gusta.toString(),
    song.agregar.toString(),
    song.comentarios
  ]);

  const escape = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escape).join(','))
  ].join('\n');

  return csvContent;
};

export const fromCSV = (csvContent: string): Song[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const songs: Song[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"') {
        if (insideQuotes && lines[i][j + 1] === '"') {
          currentValue += '"';
          j++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);

    if (values.length >= 11) {
      songs.push({
        id: values[0] || crypto.randomUUID(),
        cancion: values[1] || '',
        artista: values[2] || '',
        fts: values[3] || '',
        album: values[4] || '',
        anio: values[5] || '',
        productor: values[6] || '',
        plataformas: values[7] ? values[7].split('|').filter(p => p) as Platform[] : [],
        me_gusta: values[8] === 'true',
        agregar: values[9] === 'true',
        comentarios: values[10] || ''
      });
    }
  }

  return songs;
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
