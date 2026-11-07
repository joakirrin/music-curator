import { describe, it, expect } from 'vitest';
import { parseLLMResponse } from './openaiService';

const VALID = `Aquí tienes una selección nocturna.

=== SONG RECOMMENDATIONS START ===

SONG 1
Title: Nightcall
Artist: Kavinsky
Comment: Ancla synthwave

SONG 2
Title: A Real Hero
Artist: College & Electric Youth
Comment: Banda sonora de conducción

SONG 3
Title: Tech Noir
Artist: Gunship

=== SONG RECOMMENDATIONS END ===`;

describe('parseLLMResponse — respuestas con canciones', () => {
  it('extrae todas las canciones del bloque', () => {
    const res = parseLLMResponse(VALID, 'songs');
    expect(res.type).toBe('success');
    expect(res.songsJson?.recommendations).toHaveLength(3);
    expect(res.songsJson?.recommendations[0]).toMatchObject({
      title: 'Nightcall',
      artist: 'Kavinsky',
      comment: 'Ancla synthwave',
      reason: 'Ancla synthwave',
    });
  });

  it('guarda el texto previo al bloque como explicación', () => {
    const res = parseLLMResponse(VALID, 'songs');
    expect(res.explanationText).toBe('Aquí tienes una selección nocturna.');
  });

  it('acepta canciones sin comentario', () => {
    const res = parseLLMResponse(VALID, 'songs');
    const last = res.songsJson?.recommendations[2];
    expect(last?.title).toBe('Tech Noir');
    expect(last?.comment).toBeUndefined();
  });

  it('no distingue mayúsculas en marcadores y campos', () => {
    const raw = `=== song recommendations start ===
song 1
title: Intro
artist: The xx
comment: Minimalismo
=== song recommendations end ===`;
    const res = parseLLMResponse(raw, 'songs');
    expect(res.type).toBe('success');
    expect(res.songsJson?.recommendations[0]).toMatchObject({ title: 'Intro', artist: 'The xx' });
  });

  it('acepta "Reason:" como alternativa a "Comment:"', () => {
    const raw = `=== SONG RECOMMENDATIONS START ===
SONG 1
Title: Porcelain
Artist: Moby
Reason: Melancólica
=== SONG RECOMMENDATIONS END ===`;
    const res = parseLLMResponse(raw, 'songs');
    expect(res.songsJson?.recommendations[0].reason).toBe('Melancólica');
  });

  it('indica la cantidad de canciones encontradas', () => {
    const res = parseLLMResponse(VALID, 'songs');
    expect(res.songsJson?.requestedCount).toBe(3);
  });

  it('descarta canciones a las que les falta el artista', () => {
    const raw = `=== SONG RECOMMENDATIONS START ===
SONG 1
Title: Sin artista

SONG 2
Title: Disorder
Artist: Joy Division
=== SONG RECOMMENDATIONS END ===`;
    const res = parseLLMResponse(raw, 'songs');
    expect(res.type).toBe('success');
    expect(res.songsJson?.recommendations).toHaveLength(1);
    expect(res.songsJson?.recommendations[0].title).toBe('Disorder');
  });
});

describe('parseLLMResponse — respuestas sin canciones o defectuosas', () => {
  it('modo "songs" sin bloque devuelve un error suave con opciones', () => {
    const res = parseLLMResponse('Claro, ¿qué estilo prefieres?', 'songs');
    expect(res.type).toBe('soft_error');
    expect(res.songsJson).toBeNull();
    expect(res.error?.recoveryOptions.map((o) => o.action)).toEqual(['retry', 'continue']);
  });

  it('modo "chat" sin bloque se trata como conversación', () => {
    const res = parseLLMResponse('Hola, ¿qué tal?', 'chat');
    expect(res.type).toBe('conversation');
    expect(res.explanationText).toBe('Hola, ¿qué tal?');
  });

  it('modo "auto" sin bloque se trata como conversación', () => {
    const res = parseLLMResponse('Cuéntame más', 'auto');
    expect(res.type).toBe('conversation');
  });

  it('bloque vacío devuelve error suave', () => {
    const raw = `=== SONG RECOMMENDATIONS START ===
=== SONG RECOMMENDATIONS END ===`;
    const res = parseLLMResponse(raw, 'songs');
    expect(res.type).toBe('soft_error');
    expect(res.error?.message).toMatch(/No songs/i);
  });

  it('bloque sin la marca de cierre no se reconoce como canciones', () => {
    const raw = `=== SONG RECOMMENDATIONS START ===
SONG 1
Title: Nightcall
Artist: Kavinsky`;
    const res = parseLLMResponse(raw, 'songs');
    expect(res.type).toBe('soft_error');
  });

  it('el texto sin formato de lista (JSON, por ejemplo) no produce canciones', () => {
    const res = parseLLMResponse('{"recommendations":[{"title":"A","artist":"B"}]}', 'songs');
    expect(res.type).toBe('soft_error');
  });

  it('conserva la respuesta original sin modificar', () => {
    const res = parseLLMResponse(VALID, 'songs');
    expect(res.rawResponse).toBe(VALID);
  });
});

describe('parseLLMResponse — errores conocidos', () => {
  // ERROR CONOCIDO: el lector divide el bloque por cada "SONG <número>" sin distinguir
  // mayúsculas, así que una canción cuyo título es "Song 2" (Blur) se pierde en silencio.
  // Cuando se corrija, Vitest avisará de que este test ya pasa y habrá que quitar ".fails".
  it.fails('conserva una canción cuyo título contiene "Song 2"', () => {
    const raw = `=== SONG RECOMMENDATIONS START ===
SONG 1
Title: Song 2
Artist: Blur
Comment: Clásico del britpop
=== SONG RECOMMENDATIONS END ===`;
    const res = parseLLMResponse(raw, 'songs');
    expect(res.songsJson?.recommendations[0]).toMatchObject({ title: 'Song 2', artist: 'Blur' });
  });
});
