const MATCH_THRESHOLD = 40;

function parseBreakdown(raw) {
  try {
    return JSON.parse(raw).categories ?? [];
  } catch {
    return [];
  }
}

function overlapScore(breakdownA, breakdownB) {
  const mapA = Object.fromEntries(breakdownA.map((c) => [c.name, c.percent]));
  const mapB = Object.fromEntries(breakdownB.map((c) => [c.name, c.percent]));
  const names = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);

  let score = 0;
  for (const name of names) {
    score += Math.min(mapA[name] || 0, mapB[name] || 0);
  }
  return score;
}

// Finds the past record whose style breakdown most closely overlaps the target
// date's breakdown. Returns null if there's no usable data or no match clears
// the similarity threshold.
export function findStyleTwin(targetDate, allAnalyses) {
  const target = allAnalyses.find((a) => a.recordDate === targetDate);
  if (!target?.styleBreakdown) return null;

  const targetBreakdown = parseBreakdown(target.styleBreakdown);
  if (targetBreakdown.length === 0) return null;

  let best = null;
  for (const a of allAnalyses) {
    if (a.recordDate === targetDate || !a.styleBreakdown) continue;
    const breakdown = parseBreakdown(a.styleBreakdown);
    if (breakdown.length === 0) continue;

    const score = overlapScore(targetBreakdown, breakdown);
    if (!best || score > best.score) {
      best = { recordDate: a.recordDate, score };
    }
  }

  if (!best || best.score < MATCH_THRESHOLD) return null;
  return best;
}
