import * as bcrypt from 'bcrypt';
import { addDuration, hashToken } from './auth.service';
import { BCRYPT_ROUNDS } from './auth.constants';

describe('password hashing', () => {
  it('produces a verifiable bcrypt hash that is not the plain text', async () => {
    const plain = 'Str0ngPassphrase!';
    const hash = await bcrypt.hash(plain, BCRYPT_ROUNDS);

    expect(hash).not.toEqual(plain);
    expect(hash.startsWith('$2')).toBe(true);
    await expect(bcrypt.compare(plain, hash)).resolves.toBe(true);
    await expect(bcrypt.compare('wrong-password', hash)).resolves.toBe(false);
  });

  it('salts, so the same password hashes differently each time', async () => {
    const a = await bcrypt.hash('same-password', BCRYPT_ROUNDS);
    const b = await bcrypt.hash('same-password', BCRYPT_ROUNDS);
    expect(a).not.toEqual(b);
  });
});

describe('refresh token hashing', () => {
  it('is deterministic and never returns the raw token', () => {
    const raw = 'abc123';
    expect(hashToken(raw)).toEqual(hashToken(raw));
    expect(hashToken(raw)).not.toContain(raw);
    expect(hashToken(raw)).toHaveLength(64);
  });
});

describe('addDuration', () => {
  const base = new Date('2026-01-01T00:00:00.000Z');

  it.each([
    ['15m', '2026-01-01T00:15:00.000Z'],
    ['12h', '2026-01-01T12:00:00.000Z'],
    ['7d', '2026-01-08T00:00:00.000Z'],
    ['30s', '2026-01-01T00:00:30.000Z'],
  ])('parses %s', (input, expected) => {
    expect(addDuration(input, base).toISOString()).toEqual(expected);
  });

  it('rejects nonsense', () => {
    expect(() => addDuration('soon')).toThrow();
  });
});
