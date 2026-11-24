import { describe, it, expect } from 'vitest';
import { keepPendingAsUnverified } from './libraryHelpers';
import { makeSong } from '@/test/factories';

describe('keepPendingAsUnverified', () => {
  it('no borra canciones al parar la verificación: las pendientes pasan a sin verificar', () => {
    const songs = [
      makeSong({ id: 'a', messageId: 'm1', verificationStatus: 'checking' }),
      makeSong({ id: 'b', messageId: 'm1', verificationStatus: 'verified' }),
      makeSong({ id: 'c', messageId: 'm1', verificationStatus: 'failed' }),
      makeSong({ id: 'd', messageId: 'm2', verificationStatus: 'checking', round: 9 }),
    ];

    const result = keepPendingAsUnverified(songs, 'm1', 1);

    expect(result.map(s => s.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.map(s => s.verificationStatus)).toEqual(['unverified', 'verified', 'failed', 'checking']);
  });
});
