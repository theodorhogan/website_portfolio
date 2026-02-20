export function buildLinePath(
  values: Array<number | null>,
  xForIndex: (index: number) => number,
  yForValue: (value: number) => number,
) {
  let path = "";
  let drawing = false;

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === null) {
      drawing = false;
      continue;
    }

    const x = xForIndex(i);
    const y = yForValue(value);
    path += `${drawing ? " L" : " M"} ${x} ${y}`;
    drawing = true;
  }

  return path.trim();
}

export function getPaddedDomain(values: number[], minSpan = 0.2, paddingRatio = 0.2) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, minSpan);
  return {
    min: minValue - spread * paddingRatio,
    max: maxValue + spread * paddingRatio,
  };
}

export function buildYTicks(
  yMin: number,
  yMax: number,
  plotTop: number,
  plotHeight: number,
  count: number,
) {
  const steps = Math.max(2, count);
  return Array.from({ length: steps }, (_, idx) => {
    const ratio = idx / (steps - 1);
    const value = yMax - ratio * (yMax - yMin);
    const y = plotTop + ratio * plotHeight;
    return { value, y };
  });
}
