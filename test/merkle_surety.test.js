import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const sourceLoader = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  logLevel: 'silent',
  server: { middlewareMode: true },
  appType: 'custom'
});

const {
  computeSha256,
  computeMerkleRoot
} = await sourceLoader.ssrLoadModule('/src/mock/merkle.ts');

after(async () => {
  await sourceLoader.close();
});

function nodeSha256(data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return '0x' + createHash('sha256').update(serialized, 'utf8').digest('hex');
}

function nodeMerkleRoot(hashes) {
  if (hashes.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  let currentLevel = hashes.map(hash => hash.toLowerCase());
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let index = 0; index < currentLevel.length; index += 2) {
      const left = currentLevel[index];
      const right = currentLevel[index + 1] ?? left;
      nextLevel.push(nodeSha256(left + ':' + right));
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

describe('Action Surety SHA-256 and Merkle engine', () => {
  test('matches FIPS SHA-256 vectors, including a multi-block message', () => {
    const vectors = [
      ['', '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
      ['abc', '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
      [
        'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
        '0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
      ]
    ];

    for (const [input, expected] of vectors) {
      assert.equal(computeSha256(input), expected);
    }
  });

  test('matches Node crypto for UTF-8 strings and serialized objects', () => {
    const values = [
      'Nymrel — 你好 🔐',
      { agent: 'Codex Sol', target: 'src/main.rs', op: 'file_write' },
      { nested: { decision: 'BLOCK', riskScore: 99 }, list: [1, true, null] }
    ];

    for (const value of values) {
      assert.equal(computeSha256(value), nodeSha256(value));
    }
  });

  test('is deterministic for a one-million-byte standard vector', () => {
    const input = 'a'.repeat(1_000_000);
    const expected = '0xcdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0';
    assert.equal(computeSha256(input), expected);
    assert.equal(computeSha256(input), expected);
  });

  test('matches an independent Merkle oracle for empty, single, even, and odd trees', () => {
    const leaves = ['leaf-1', 'leaf-2', 'leaf-3', 'leaf-4'].map(computeSha256);

    for (const count of [0, 1, 2, 3, 4]) {
      const selected = leaves.slice(0, count);
      const before = [...selected];
      assert.equal(computeMerkleRoot(selected), nodeMerkleRoot(selected));
      assert.deepEqual(selected, before, 'root calculation must not mutate caller input');
    }
  });

  test('canonicalizes valid uppercase leaves without weakening validation', () => {
    const lower = computeSha256('case-normalization');
    const upper = '0x' + lower.slice(2).toUpperCase();
    assert.equal(computeMerkleRoot([upper]), lower);
  });

  test('fails closed for malformed leaves and non-serializable payloads', () => {
    const valid = computeSha256('valid');
    assert.throws(
      () => computeMerkleRoot(['not-a-sha256']),
      error => error instanceof TypeError && /index 0/.test(error.message)
    );
    assert.throws(
      () => computeMerkleRoot([valid, '0x1234']),
      error => error instanceof TypeError && /index 1/.test(error.message)
    );
    assert.throws(
      () => computeSha256({ toJSON: () => undefined }),
      error => error instanceof TypeError && /JSON-serializable/.test(error.message)
    );
  });
});
