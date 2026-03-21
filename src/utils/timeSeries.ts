export type TimedValuePoint = {
  time: number;
  value: number;
};

export function getYearAnchorValue(series: TimedValuePoint[], year: number) {
  const yearStartTime = Date.UTC(year, 0, 1);
  let lastBeforeOrOnStart: number | null = null;

  for (const point of series) {
    if (point.time <= yearStartTime) {
      lastBeforeOrOnStart = point.value;
      continue;
    }
    break;
  }

  if (lastBeforeOrOnStart !== null) return lastBeforeOrOnStart;

  for (const point of series) {
    if (new Date(point.time).getUTCFullYear() === year) {
      return point.value;
    }
  }

  return null;
}
