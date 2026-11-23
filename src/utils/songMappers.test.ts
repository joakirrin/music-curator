import { describe, it, expect } from 'vitest';
import {
  mapChatGPTRecommendationToSong,
  mapSongToFeedbackItem,
  mapSongToReplacementItem,
} from './songMappers';
import { makeSong } from '@/test/factories';

describe('mapChatGPTRecommendationToSong', () => {
  it('construye una canción pendiente con los datos básicos', () => {
    const song = mapChatGPTRecommendationToSong(
      { title: 'Nightcall', artist: 'Kavinsky', album: 'OutRun', year: '2013', reason: 'Ancla' },
      1,
      0
    );
    expect(song).toMatchObject({
      title: 'Nightcall',
      artist: 'Kavinsky',
      album: 'OutRun',
      year: '2013',
      source: 'chatgpt',
      round: 1,
      feedback: 'pending',
      comments: 'Ancla',
      liked: false,
      toAdd: false,
      platforms: [],
    });
    expect(song.id).toMatch(/^chatgpt-\d+-0$/);
  });

  it('marca la verificación como "checking" por defecto y la omite si se pide', () => {
    const rec = { title: 'A', artist: 'B' };
    expect(mapChatGPTRecommendationToSong(rec, 1, 0).verificationStatus).toBe('checking');
    expect(mapChatGPTRecommendationToSong(rec, 1, 0, false).verificationStatus).toBeUndefined();
  });

  it('lanza un error claro si falta el título o el artista', () => {
    expect(() => mapChatGPTRecommendationToSong({ title: '', artist: 'B' }, 1, 2)).toThrow(
      /#3 is missing required fields/
    );
    expect(() => mapChatGPTRecommendationToSong({ title: 'A', artist: '' }, 1, 0)).toThrow(
      /missing required fields/
    );
  });

  it('usa el índice para generar identificadores distintos', () => {
    const a = mapChatGPTRecommendationToSong({ title: 'A', artist: 'B' }, 1, 0);
    const b = mapChatGPTRecommendationToSong({ title: 'A', artist: 'B' }, 1, 1);
    expect(a.id).not.toBe(b.id);
  });

  describe('normalización de enlaces', () => {
    const link = (input: string) =>
      mapChatGPTRecommendationToSong({ title: 'A', artist: 'B', serviceUrl: input }, 1, 0).spotifyUri;

    // ERROR CONOCIDO: normalizeServiceLink devuelve la entrada tal cual si contiene ":" y toda
    // URL (https://...) la contiene, así que las ramas que convierten URLs nunca se ejecutan.
    // Cuando se corrija, Vitest avisará de que este test ya pasa y habrá que quitar ".fails".
    it.fails('convierte una URL de Spotify en URI', () => {
      expect(link('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')).toBe(
        'spotify:track:4uLU6hMCjMI75M1A2tKUQC'
      );
    });

    // ERROR CONOCIDO: normalizeServiceLink devuelve la entrada tal cual si contiene ":" y toda
    // URL (https://...) la contiene, así que las ramas que convierten URLs nunca se ejecutan.
    // Cuando se corrija, Vitest avisará de que este test ya pasa y habrá que quitar ".fails".
    it.fails('convierte URLs de YouTube (watch y youtu.be)', () => {
      expect(link('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube:video:dQw4w9WgXcQ');
      expect(link('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube:video:dQw4w9WgXcQ');
    });

    it('deja intacta una URI que ya tiene formato "servicio:tipo:id"', () => {
      expect(link('spotify:track:4uLU6hMCjMI75M1A2tKUQC')).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC');
    });

    it('trata un identificador de 22 caracteres como pista de Spotify', () => {
      expect(link('4uLU6hMCjMI75M1A2tKUQC')).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC');
    });

    it('sin enlace deja el campo vacío', () => {
      const song = mapChatGPTRecommendationToSong({ title: 'A', artist: 'B' }, 1, 0);
      expect(song.spotifyUri).toBeUndefined();
    });

    // ERROR CONOCIDO: normalizeServiceLink devuelve la entrada tal cual si contiene ":" y toda
    // URL (https://...) la contiene, así que las ramas que convierten URLs nunca se ejecutan.
    // Cuando se corrija, Vitest avisará de que este test ya pasa y habrá que quitar ".fails".
    it.fails('acepta spotifyUrl como alternativa a serviceUrl', () => {
      const song = mapChatGPTRecommendationToSong(
        { title: 'A', artist: 'B', spotifyUrl: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' },
        1,
        0
      );
      expect(song.spotifyUri).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC');
    });
  });
});

describe('mapSongToFeedbackItem', () => {
  it('traduce "keep" a keep y cualquier otro estado a skip', () => {
    expect(mapSongToFeedbackItem(makeSong({ feedback: 'keep' })).decision).toBe('keep');
    expect(mapSongToFeedbackItem(makeSong({ feedback: 'skip' })).decision).toBe('skip');
    expect(mapSongToFeedbackItem(makeSong({ feedback: 'pending' })).decision).toBe('skip');
  });

  it('incluye el comentario del usuario solo si existe', () => {
    expect(mapSongToFeedbackItem(makeSong({ userFeedback: 'Me encanta' })).userFeedback).toBe('Me encanta');
    expect(mapSongToFeedbackItem(makeSong()).userFeedback).toBeUndefined();
  });
});

describe('mapSongToReplacementItem', () => {
  it('usa el error de verificación como motivo', () => {
    expect(mapSongToReplacementItem(makeSong({ verificationError: 'mismatch' })).reason).toBe('mismatch');
  });

  it('usa "not_found" cuando no hay motivo', () => {
    expect(mapSongToReplacementItem(makeSong()).reason).toBe('not_found');
  });
});
