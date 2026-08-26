// Seoul coordinates — this app currently has no per-user location setting,
// so historical weather is looked up for Seoul as a reasonable default.
const LAT = 37.5665;
const LON = 126.978;

function bucketWeatherCode(code) {
  if (code === 0 || code === 1) return '맑음';
  if (code === 2 || code === 3) return '흐림';
  if ([45, 48].includes(code)) return '안개';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '눈';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return '비';
  return null;
}

// Returns { [recordDate]: weatherLabel } for every date in [startDate, endDate]
// that the weather archive has data for. Dates outside the archive's coverage
// (e.g. too recent, or in the future) are simply omitted from the result.
export async function fetchWeatherRange(startDate, endDate) {
  const today = new Date().toISOString().slice(0, 10);
  const clampedEnd = endDate > today ? today : endDate;
  if (startDate > clampedEnd) return {};

  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}` +
    `&start_date=${startDate}&end_date=${clampedEnd}&daily=weathercode&timezone=Asia%2FSeoul`;

  const res = await fetch(url);
  if (!res.ok) return {};
  const data = await res.json();

  const dates = data?.daily?.time ?? [];
  const codes = data?.daily?.weathercode ?? [];

  const byDate = {};
  dates.forEach((date, i) => {
    const label = bucketWeatherCode(codes[i]);
    if (label) byDate[date] = label;
  });
  return byDate;
}
