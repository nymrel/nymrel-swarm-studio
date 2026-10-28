import { describe, expect, it } from 'vitest';
import { createInitialScenarioLogs } from '../src/mock/simulationEngine';
import { filterScenarioLogs } from '../src/state/filterScenarioLogs';
import type { LogFilter } from '../src/state/swarmStore';

const { logs } = createInitialScenarioLogs(0);
const first = logs[0]!;
const inconsistent = { ...first, id: 'inconsistent', localDigest: { ...first.localDigest, locallyConsistent: false } };
const records = [...logs, inconsistent];

describe('filterScenarioLogs', () => {
  it('treats padded and mixed-case searches like the unpadded query', () => {
    const expected = filterScenarioLogs(records, 'ALL', 'example');
    expect(expected.length).toBeGreaterThan(0);
    expect(filterScenarioLogs(records, 'ALL', '  ExAmPlE  ')).toEqual(expected);
  });

  it.each(['ALL', 'ALLOW', 'BLOCK', 'HASHES'] as LogFilter[])('preserves %s filtering for empty and whitespace searches', filter => {
    const expected = records.filter(log => filter === 'ALL' ||
      (filter === 'ALLOW' && log.decision === 'ALLOW') ||
      (filter === 'BLOCK' && log.decision === 'BLOCK') ||
      (filter === 'HASHES' && log.localDigest.locallyConsistent));
    expect(filterScenarioLogs(records, filter, '')).toEqual(expected);
    expect(filterScenarioLogs(records, filter, ' 	 ')).toEqual(expected);
  });

  it('searches target, agent, rule, and leaf hash while respecting decision filters', () => {
    const blocked = logs.find(log => log.decision === 'BLOCK')!;
    for (const term of [blocked.target, blocked.agentName, blocked.policyRule, blocked.localDigest.leafHash]) {
      expect(filterScenarioLogs(logs, 'BLOCK', `  ${term.toUpperCase()}  `)).toContain(blocked);
      expect(filterScenarioLogs(logs, 'ALLOW', term)).not.toContain(blocked);
    }
    expect(filterScenarioLogs(logs, 'ALL', 'no-such-record')).toEqual([]);
  });
});
