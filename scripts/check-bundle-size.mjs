import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const dist = path.join(root, 'dist');
const budgets = {
  totalRawBytes: 700_000,
  totalGzipBytes: 180_000,
  largestJavaScriptGzipBytes: 135_000,
};

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const files = await walk(dist);
const shipped = files.filter(file => !file.endsWith('_headers'));
if (files.some(file => file.endsWith('.map'))) throw new Error('Production source maps must not be shipped.');

let totalRawBytes = 0;
let totalGzipBytes = 0;
let largestJavaScriptGzipBytes = 0;
for (const file of shipped) {
  const metadata = await stat(file);
  const bytes = await readFile(file);
  const gzipBytes = gzipSync(bytes, { level: 9 }).byteLength;
  totalRawBytes += metadata.size;
  totalGzipBytes += gzipBytes;
  if (file.endsWith('.js')) largestJavaScriptGzipBytes = Math.max(largestJavaScriptGzipBytes, gzipBytes);
}

const required = ['index.html', 'llms.txt', 'robots.txt', '_headers'];
for (const file of required) {
  if (!files.some(candidate => path.relative(dist, candidate).replaceAll('\\', '/') === file)) {
    throw new Error(`Missing required static artifact: ${file}`);
  }
}

const measurements = { totalRawBytes, totalGzipBytes, largestJavaScriptGzipBytes };
for (const [key, budget] of Object.entries(budgets)) {
  if (measurements[key] > budget) throw new Error(`${key} ${measurements[key]} exceeds budget ${budget}`);
}

console.log(JSON.stringify({ files: shipped.length, measurements, budgets }, null, 2));
