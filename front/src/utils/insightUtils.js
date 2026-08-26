export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export const SEASON_LABELS = ['봄', '여름', '가을', '겨울'];

export function weekdayOf(recordDate) {
  const [y, m, d] = recordDate.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function seasonOf(recordDate) {
  const month = Number(recordDate.split('-')[1]);
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

function splitTags(value) {
  return value ? value.split(',').filter(Boolean) : [];
}

// records: array of { recordDate, tagsValue } where tagsValue is the raw CSV field
// tags: full known tag list (used so every group reports 0% for tags that never occurred)
// groupKeyFn: (record) => group key, defaults to weekdayOf(record.recordDate)
export function computeTagFrequencyByGroup(records, tags, groupKeyFn = (r) => weekdayOf(r.recordDate)) {
  const byGroup = {};

  for (const record of records) {
    const recordTags = splitTags(record.tagsValue);
    if (recordTags.length === 0) continue;

    const key = groupKeyFn(record);
    if (!byGroup[key]) {
      byGroup[key] = { total: 0, counts: Object.fromEntries(tags.map((t) => [t, 0])) };
    }
    byGroup[key].total += 1;
    for (const tag of recordTags) {
      if (key in byGroup && tag in byGroup[key].counts) {
        byGroup[key].counts[tag] += 1;
      }
    }
  }

  for (const group of Object.values(byGroup)) {
    group.percents = Object.fromEntries(
      tags.map((t) => [t, group.total > 0 ? Math.round((group.counts[t] / group.total) * 100) : 0]),
    );
  }

  return byGroup;
}

// Finds the group with the highest percentage for a given tag, only if it's
// meaningfully ahead of the overall average for that tag (avoids noisy call-outs
// from small sample sizes).
export function findStandoutInsight(byGroup, tag, groupLabels) {
  const entries = Object.entries(byGroup).filter(([, g]) => g.total > 0);
  if (entries.length === 0) return null;

  const totalOccurrences = entries.reduce((sum, [, g]) => sum + g.counts[tag], 0);
  const totalRecords = entries.reduce((sum, [, g]) => sum + g.total, 0);
  const overallPercent = totalRecords > 0 ? (totalOccurrences / totalRecords) * 100 : 0;

  let best = null;
  for (const [key, g] of entries) {
    const percent = g.percents[tag];
    if (percent > overallPercent + 15 && (!best || percent > best.percent)) {
      best = { groupKey: key, label: groupLabels ? groupLabels[key] : key, percent };
    }
  }
  return best;
}
