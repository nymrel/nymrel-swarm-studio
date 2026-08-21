import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Standalone SHA-256 and Merkle implementation test against Node crypto standard
function computeSha256(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return '0x' + createHash('sha256').update(str).digest('hex');
}

function computeMerkleRoot(hashes) {
  if (hashes.length === 0) return '0x0000000000000000000000000000000000000000000000000000000000000000';
  if (hashes.length === 1) return hashes[0];

  let currentLevel = [...hashes];
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = computeSha256(left + ':' + right);
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

// Security Interceptor Policy Engine
function evaluateSuretyPolicy(action) {
  const destructivePatterns = [/rm\s+-rf/, /mkfs/, /dd\s+if=/, />\s*\/dev\/sd/, /DROP\s+DATABASE/i];
  const secretPatterns = [/AWS_SECRET/, /PRIVATE_KEY/, /\/etc\/shadow/, /id_rsa/, /bearer/i];

  if (destructivePatterns.some(p => p.test(action.target))) {
    return {
      decision: 'BLOCK',
      riskScore: 99,
      rule: 'RULE-SEC-00: Intercepted destructive filesystem operation'
    };
  }

  if (secretPatterns.some(p => p.test(action.target))) {
    return {
      decision: 'BLOCK',
      riskScore: 96,
      rule: 'RULE-VAULT-01: Unauthorized credential access denied'
    };
  }

  if (action.actionType === 'network_egress' && !action.target.includes('github.com') && !action.target.includes('cloudflare.com')) {
    return {
      decision: 'SANDBOX',
      riskScore: 65,
      rule: 'RULE-NET-09: Unverified external endpoint routed to sandbox proxy'
    };
  }

  return {
    decision: 'ALLOW',
    riskScore: 8,
    rule: 'RULE-AST-01: Verified in-scope development operation'
  };
}

describe('Action Surety & Merkle Cryptographic Engine', () => {
  test('computes deterministic SHA-256 leaf hashes', () => {
    const payload = { agent: 'Codex Sol', target: 'src/main.rs', op: 'file_write' };
    const hash1 = computeSha256(payload);
    const hash2 = computeSha256(payload);
    assert.equal(hash1, hash2);
    assert.match(hash1, /^0x[a-f0-9]{64}$/);
  });

  test('computes valid Merkle Root for single and multiple leaves', () => {
    const leaf1 = computeSha256('leaf-1');
    const leaf2 = computeSha256('leaf-2');
    const leaf3 = computeSha256('leaf-3');

    const rootSingle = computeMerkleRoot([leaf1]);
    assert.equal(rootSingle, leaf1);

    const rootMulti = computeMerkleRoot([leaf1, leaf2, leaf3]);
    assert.match(rootMulti, /^0x[a-f0-9]{64}$/);
    assert.notEqual(rootMulti, leaf1);
  });

  test('intercepts and blocks destructive shell execution commands', () => {
    const dangerousAction = {
      agentId: 'agent-rogue',
      actionType: 'shell_exec',
      target: 'rm -rf /var/run/secrets'
    };
    const evaluation = evaluateSuretyPolicy(dangerousAction);
    assert.equal(evaluation.decision, 'BLOCK');
    assert.equal(evaluation.riskScore, 99);
    assert.match(evaluation.rule, /RULE-SEC-00/);
  });

  test('intercepts and blocks secret environment credential reads', () => {
    const secretAction = {
      agentId: 'agent-plugin',
      actionType: 'secret_read',
      target: 'process.env["AWS_SECRET_ACCESS_KEY"]'
    };
    const evaluation = evaluateSuretyPolicy(secretAction);
    assert.equal(evaluation.decision, 'BLOCK');
    assert.equal(evaluation.riskScore, 96);
  });

  test('sandboxes unverified network egress requests', () => {
    const networkAction = {
      agentId: 'agent-gemini',
      actionType: 'network_egress',
      target: 'https://untrusted-exfil-sink.dev/api'
    };
    const evaluation = evaluateSuretyPolicy(networkAction);
    assert.equal(evaluation.decision, 'SANDBOX');
    assert.equal(evaluation.riskScore, 65);
  });

  test('allows safe in-scope source file modifications', () => {
    const safeAction = {
      agentId: 'agent-codex-sol',
      actionType: 'file_write',
      target: 'src/surety/merkle_interceptor.rs'
    };
    const evaluation = evaluateSuretyPolicy(safeAction);
    assert.equal(evaluation.decision, 'ALLOW');
    assert.equal(evaluation.riskScore, 8);
  });
});
