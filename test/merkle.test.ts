import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { computeMerkleRoot, computeSha256 } from '../src/mock/merkle';

const EMPTY_ROOT = '0x' + '0'.repeat(64);

function nodeSha256(data: string | object): string {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  if (serialized === undefined) throw new TypeError('undefined serialization');
  return '0x' + createHash('sha256').update(serialized, 'utf8').digest('hex');
}

function nodeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return EMPTY_ROOT;
  let level = hashes.map(hash => hash.toLowerCase());
  while (level.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index]!;
      const right = level[index + 1] ?? left;
      next.push(nodeSha256(`${left}:${right}`));
    }
    level = next;
  }
  return level[0]!;
}

describe('fixture SHA-256 and Merkle helpers', () => {
  it.each([
    ['', '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'],
  ])('matches the FIPS vector for %j', (input, expected) => {
    expect(computeSha256(input)).toBe(expected);
  });

  it('matches Node crypto for UTF-8 strings and serialized objects', () => {
    const values: Array<string | object> = [
      'Nymrel — 你好 🔐',
      { role: 'example-worker', target: 'src/example.ts', operation: 'file_write' },
      { nested: { decision: 'BLOCK', riskScore: 99 }, list: [1, true, null] },
    ];
    for (const value of values) expect(computeSha256(value)).toBe(nodeSha256(value));
  });

  it('handles a one-million-byte standard vector', () => {
    expect(computeSha256('a'.repeat(1_000_000))).toBe(
      '0xcdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    );
  });

  it('matches an independent oracle without mutating leaves', () => {
    const leaves = ['one', 'two', 'three', 'four'].map(computeSha256);
    for (const count of [0, 1, 2, 3, 4]) {
      const selected = leaves.slice(0, count);
      const before = [...selected];
      expect(computeMerkleRoot(selected)).toBe(nodeMerkleRoot(selected));
      expect(selected).toEqual(before);
    }
  });

  it('canonicalizes uppercase leaves and fails closed on malformed inputs', () => {
    const lower = computeSha256('case');
    expect(computeMerkleRoot(['0x' + lower.slice(2).toUpperCase()])).toBe(lower);
    expect(() => computeMerkleRoot(['not-a-hash'])).toThrow(/index 0/);
    expect(() => computeMerkleRoot([lower, '0x1234'])).toThrow(/index 1/);
    expect(() => computeSha256({ toJSON: () => undefined })).toThrow(/JSON-serializable/);
  });
});
