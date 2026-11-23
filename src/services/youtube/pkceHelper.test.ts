// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  generatePKCEParams,
  storePKCEParams,
  retrievePKCEParams,
  validateState,
  clearPKCEParams,
} from './pkceHelper';

// jsdom no incluye crypto.subtle; usamos el de Node, que es el mismo estándar que el navegador.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

beforeEach(() => {
  localStorage.clear();
});

describe('generatePKCEParams', () => {
  it('genera verificador, desafío y estado con el formato esperado', async () => {
    const { verifier, challenge, state } = await generatePKCEParams();
    expect(verifier).toMatch(/^[0-9a-f]{128}$/);
    expect(state).toMatch(/^[0-9a-f]{64}$/);
    // SHA-256 en base64url sin relleno = 43 caracteres
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('el desafío corresponde al SHA-256 del verificador', async () => {
    const { verifier, challenge } = await generatePKCEParams();
    const digest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const expected = Buffer.from(digest).toString('base64url');
    expect(challenge).toBe(expected);
  });

  it('cada llamada produce valores distintos', async () => {
    const a = await generatePKCEParams();
    const b = await generatePKCEParams();
    expect(a.verifier).not.toBe(b.verifier);
    expect(a.state).not.toBe(b.state);
  });
});

describe('almacenamiento de parámetros PKCE', () => {
  it('guarda y recupera por plataforma', () => {
    storePKCEParams('spotify', 'v-sp', 's-sp');
    storePKCEParams('youtube', 'v-yt', 's-yt');
    expect(retrievePKCEParams('spotify')).toEqual({ verifier: 'v-sp', state: 's-sp' });
    expect(retrievePKCEParams('youtube')).toEqual({ verifier: 'v-yt', state: 's-yt' });
  });

  it('sin datos devuelve nulos', () => {
    expect(retrievePKCEParams('youtube')).toEqual({ verifier: null, state: null });
  });

  it('borrar una plataforma no afecta a la otra', () => {
    storePKCEParams('spotify', 'v-sp', 's-sp');
    storePKCEParams('youtube', 'v-yt', 's-yt');
    clearPKCEParams('youtube');
    expect(retrievePKCEParams('youtube')).toEqual({ verifier: null, state: null });
    expect(retrievePKCEParams('spotify').verifier).toBe('v-sp');
  });
});

describe('validateState', () => {
  it('acepta el estado guardado', () => {
    storePKCEParams('youtube', 'v', 'abc');
    expect(validateState('youtube', 'abc')).toBe(true);
  });

  it('rechaza un estado distinto', () => {
    storePKCEParams('youtube', 'v', 'abc');
    expect(validateState('youtube', 'otro')).toBe(false);
  });

  it('rechaza si no hay estado guardado (por ejemplo, al volver desde otro dominio)', () => {
    expect(validateState('youtube', 'abc')).toBe(false);
  });

  it('no confunde el estado de una plataforma con el de la otra', () => {
    storePKCEParams('spotify', 'v', 'abc');
    expect(validateState('youtube', 'abc')).toBe(false);
  });
});
