import type { ScenarioEvent } from '../types';
import type { LogFilter } from './swarmStore';

export function filterScenarioLogs(logs: ScenarioEvent[], filter: LogFilter, searchQuery: string): ScenarioEvent[] {
  const query = searchQuery.trim().toLowerCase();
  return logs.filter(log => {
    if (filter === 'ALLOW' && log.decision !== 'ALLOW') return false;
    if (filter === 'BLOCK' && log.decision !== 'BLOCK') return false;
    if (filter === 'HASHES' && !log.localDigest.locallyConsistent) return false;

    return !query || [log.target, log.agentName, log.policyRule, log.localDigest.leafHash]
      .some(value => value.toLowerCase().includes(query));
  });
}
