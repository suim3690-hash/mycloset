export function parseWardrobeItems(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed.items ?? [];
  } catch {
    return [];
  }
}

export function flattenWardrobeRecords(records) {
  const flat = [];
  (records ?? []).forEach((record) => {
    parseWardrobeItems(record.itemsJson).forEach((item) => {
      flat.push({
        category: item.category,
        name: item.name,
        photoPath: record.photoPath,
        recordDate: record.recordDate,
      });
    });
  });
  return flat;
}
