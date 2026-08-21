import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function computeEfficiencyStats(agents) {
  let localGpuTokens = 0;
  let edgeWorkersTokens = 0;
  let meteredFrontierTokens = 0;

  agents.forEach(a => {
    if (a.hardware === 'Local RTX 4090') {
      localGpuTokens += a.totalTokens;
    } else if (a.hardware === 'Edge Workers AI') {
      edgeWorkersTokens += a.totalTokens;
    } else {
      meteredFrontierTokens += a.totalTokens;
    }
  });

  const totalTokens = localGpuTokens + edgeWorkersTokens + meteredFrontierTokens;
  const estimatedCostSpent = (meteredFrontierTokens * 0.000015) + (edgeWorkersTokens * 0.0000005);
  const frontierBaselineCost = totalTokens * 0.000015;
  const dollarsSaved = Math.max(0, frontierBaselineCost - estimatedCostSpent);
  const efficiencyScore = totalTokens > 0 ? Math.round(((localGpuTokens + edgeWorkersTokens) / totalTokens) * 100) : 0;

  return {
    localGpuTokens,
    edgeWorkersTokens,
    meteredFrontierTokens,
    totalTokens,
    estimatedCostSpent: parseFloat(estimatedCostSpent.toFixed(2)),
    frontierBaselineCost: parseFloat(frontierBaselineCost.toFixed(2)),
    dollarsSaved: parseFloat(dollarsSaved.toFixed(2)),
    efficiencyScore
  };
}

describe('Token Routing & Peak-Efficiency Economics', () => {
  test('accurately calculates token allocations and cost savings against frontier baseline', () => {
    const agents = [
      { name: 'Codex Sol', hardware: 'Frontier Cloud', totalTokens: 100000 },
      { name: 'Claude Opus 5', hardware: 'Frontier Cloud', totalTokens: 100000 },
      { name: 'Hermes 3 (Local GPU)', hardware: 'Local RTX 4090', totalTokens: 500000 },
      { name: 'Cloudflare Sentinel', hardware: 'Edge Workers AI', totalTokens: 300000 }
    ];

    const stats = computeEfficiencyStats(agents);

    assert.equal(stats.totalTokens, 1000000);
    assert.equal(stats.localGpuTokens, 500000);
    assert.equal(stats.edgeWorkersTokens, 300000);
    assert.equal(stats.meteredFrontierTokens, 200000);

    // 800,000 / 1,000,000 = 80% Non-metered efficiency
    assert.equal(stats.efficiencyScore, 80);

    // Frontier baseline: 1,000,000 * 0.000015 = $15.00
    assert.equal(stats.frontierBaselineCost, 15.00);

    // Actual spent: (200,000 * 0.000015) + (300,000 * 0.0000005) = $3.00 + $0.15 = $3.15
    assert.equal(stats.estimatedCostSpent, 3.15);

    // Dollars saved: $15.00 - $3.15 = $11.85
    assert.equal(stats.dollarsSaved, 11.85);
  });
});
