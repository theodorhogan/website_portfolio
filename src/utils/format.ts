export type ChangeTone = "positive" | "negative" | "neutral";

/** Changes smaller than this render as flat, so "-0.00%" never appears. */
const FLAT_EPSILON = 0.00005;

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function isFlat(value: number) {
  return Math.abs(value) < FLAT_EPSILON;
}

export function getChangeTone(change: number | null): ChangeTone {
  if (change === null || isFlat(change)) return "neutral";
  return change > 0 ? "positive" : "negative";
}

/** Tone for series where a lower number is the good outcome (yields, spreads). */
export function getInverseChangeTone(change: number | null): ChangeTone {
  if (change === null || isFlat(change)) return "neutral";
  return change < 0 ? "positive" : "negative";
}

/** `1,234.56`, or `--` when missing. */
export function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "--";
  return priceFormatter.format(price);
}

/** Fractional change (0.0123) -> `+1.23%`, optionally wrapped as `[+1.23%]`; `--` when there is nothing to compare. */
export function formatPercentChange(change: number | null, bracketed = false) {
  if (change === null) return "--";
  const base = isFlat(change) ? "0.00%" : `${change > 0 ? "+" : ""}${(change * 100).toFixed(2)}%`;
  return bracketed ? `[${base}]` : base;
}
