// Fixed SHA-256 constants from FIPS PUB 180-4. Keeping the implementation
// synchronous preserves the existing browser/store API while TextEncoder makes
// string hashing match Node and Web Crypto's UTF-8 semantics.
const SHA256_INITIAL_STATE = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
] as const;

const SHA256_ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
] as const;

const SHA256_HEX_PATTERN = /^0x[0-9a-f]{64}$/i;

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Sync(input: string): string {
  const inputBytes = new TextEncoder().encode(input);
  const paddedLength = Math.ceil((inputBytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(inputBytes);
  padded[inputBytes.length] = 0x80;

  const bitLength = inputBytes.length * 8;
  const paddedView = new DataView(padded.buffer);
  paddedView.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  paddedView.setUint32(paddedLength - 4, bitLength >>> 0, false);

  let h0: number = SHA256_INITIAL_STATE[0];
  let h1: number = SHA256_INITIAL_STATE[1];
  let h2: number = SHA256_INITIAL_STATE[2];
  let h3: number = SHA256_INITIAL_STATE[3];
  let h4: number = SHA256_INITIAL_STATE[4];
  let h5: number = SHA256_INITIAL_STATE[5];
  let h6: number = SHA256_INITIAL_STATE[6];
  let h7: number = SHA256_INITIAL_STATE[7];
  const schedule = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      schedule[i] = paddedView.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const word15 = schedule[i - 15]!;
      const word2 = schedule[i - 2]!;
      const s0 = rightRotate(word15, 7) ^ rightRotate(word15, 18) ^ (word15 >>> 3);
      const s1 = rightRotate(word2, 17) ^ rightRotate(word2, 19) ^ (word2 >>> 10);
      schedule[i] = (schedule[i - 16]! + s0 + schedule[i - 7]! + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const sum1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sum1 + choice + SHA256_ROUND_CONSTANTS[i]! + schedule[i]!) >>> 0;
      const sum0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(word => word.toString(16).padStart(8, '0'))
    .join('');
}

export function computeSha256(data: string | object): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  if (str === undefined) {
    throw new TypeError('SHA-256 input must be a JSON-serializable string or object');
  }
  return '0x' + sha256Sync(str);
}

export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return '0x0000000000000000000000000000000000000000000000000000000000000000';

  const normalizedHashes = hashes.map((hash, index) => {
    if (!SHA256_HEX_PATTERN.test(hash)) {
      throw new TypeError(`Invalid SHA-256 leaf at index ${index}`);
    }
    return hash.toLowerCase();
  });

  if (normalizedHashes.length === 1) return normalizedHashes[0]!;

  let currentLevel = normalizedHashes;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]!;
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1]! : left;
      const combined = computeSha256(left + ':' + right);
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0]!;
}
