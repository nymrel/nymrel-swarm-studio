import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function walk(relativeDirectory) {
  const entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relativePath));
    else files.push(relativePath);
  }
  return files;
}

function requireText(file, content, expected) {
  if (!content.includes(expected)) failures.push(`${file}: missing required text ${JSON.stringify(expected)}`);
}

function rejectText(file, content, forbidden) {
  if (content.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`${file}: contains forbidden legacy claim ${JSON.stringify(forbidden)}`);
  }
}

const packageJson = JSON.parse(await read('package.json'));
if (packageJson.private !== true) failures.push('package.json: application must remain private');
if (!String(packageJson.engines?.node ?? '').includes('>=22.12')) failures.push('package.json: Node 22.12+ floor is required');
if (!String(packageJson.packageManager ?? '').startsWith('npm@11.')) failures.push('package.json: npm 11 packageManager pin is required');
if (packageJson.scripts?.prepublishOnly || packageJson.scripts?.publish) failures.push('package.json: npm publication scripts are forbidden for this static app');

const headers = await read('public/_headers');
requireText('public/_headers', headers, "connect-src 'none'");
requireText('public/_headers', headers, "script-src 'self'");
for (const forbidden of ['Access-Control-Allow-Origin', 'X-Machine-Trust', 'X-XSS-Protection', "script-src 'self' 'unsafe-inline'"]) {
  rejectText('public/_headers', headers, forbidden);
}

const index = await read('index.html');
requireText('index.html', index, 'fixture-driven Nymrel reference interface');
rejectText('index.html', index, 'fonts.googleapis.com');
rejectText('index.html', index, 'SoftwareApplication');

const app = await read('src/App.tsx');
requireText('src/App.tsx', app, 'Synthetic fixture · browser-only');
requireText('src/App.tsx', app, 'No agents, repositories, providers, telemetry, files, commands, sandboxes, or deployments are connected.');

const scanFiles = [
  'README.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'llms.txt',
  'public/llms.txt',
  'index.html',
  ...await walk('src'),
].filter(file => /\.(?:css|html|md|ts|tsx|txt)$/.test(file));

const forbiddenClaims = [
  'Google A2UI v0.8',
  'tamper-proof',
  'real-time agent topology',
  'Authorize & Deploy',
  'Execution payload dispatched',
  'Rollback complete:',
  'Actual Spent',
  'Dollars Saved',
  '5 / 5 Online',
  'Live Swarm Agent Topology',
  'instant rollback guarantees',
  'GPT-5.6',
  'Claude Opus',
  'Gemini 3.6',
  'Hermes 3',
];

for (const file of scanFiles) {
  const content = await read(file);
  for (const forbidden of forbiddenClaims) rejectText(file, content, forbidden);
}

const sourceFiles = (await walk('src')).filter(file => /\.(?:ts|tsx)$/.test(file));
for (const file of sourceFiles) {
  const content = await read(file);
  for (const forbidden of ['fetch(', 'new WebSocket(', 'new EventSource(', 'XMLHttpRequest', 'dangerouslySetInnerHTML', 'eval(', 'new Function(']) {
    if (content.includes(forbidden)) failures.push(`${file}: outbound or unsafe runtime primitive is outside the static fixture boundary: ${forbidden}`);
  }
}

const workflowFiles = (await walk('.github/workflows')).filter(file => /\.ya?ml$/.test(file));
for (const file of workflowFiles) {
  const content = await read(file);
  if (content.includes('pull_request_target:')) failures.push(`${file}: pull_request_target is outside this repository's trust model`);
  for (const line of content.split(/\r?\n/)) {
    const action = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/)?.[1];
    if (action && !/@[0-9a-f]{40}$/i.test(action)) failures.push(`${file}: action is not pinned by full commit: ${action}`);
    if (/\bnpm ci\b/.test(line) && !line.includes('--ignore-scripts')) failures.push(`${file}: npm ci must disable lifecycle scripts`);
  }
}

if (failures.length > 0) {
  console.error('Static truth validation failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Static truth validation passed across ${scanFiles.length} product surfaces.`);
}
