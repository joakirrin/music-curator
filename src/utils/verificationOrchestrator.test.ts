import { describe, it, expect } from 'vitest';
import { verifySongsInBatch } from './verificationOrchestrator';
import { makeSong } from '@/test/factories';

describe('verifySongsInBatch', () => {
  it('si se para (timeout o cancelar) devuelve lo comprobado hasta ahí en vez de lanzar un error', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await verifySongsInBatch([makeSong({ verificationStatus: 'checking' })], undefined, controller.signal);

    expect(result.verifiedSongs).toEqual([]);
  });
});
