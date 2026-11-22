/**
 * Shared date helpers.
 *
 * Every dataset in this app is keyed by a UTC-midnight timestamp, so all
 * helpers here read and write UTC fields. Formatting a data timestamp with
 * local-time getters shifts the date by a day for visitors west of UTC.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

export const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const pad2 = (value: number) => String(value).padStart(2, "0");

/** Excel serial day number -> UTC-midnight timestamp. */
export function toExcelUtcTime(serial: number) {
  return EXCEL_EPOCH_UTC + Math.round(serial) * DAY_MS;
}

/** `M/D/YYYY` (optionally quoted) -> UTC-midnight timestamp, or null. */
export function parseUsDateToUtcTime(raw: string) {
  const match = raw.trim().replace(/^"|"$/g, "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  return Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
}

/** The local calendar date of `date`, expressed as a UTC-midnight timestamp. */
export function localDateToUtcTime(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/** ISO-8601 week number (1-53) of a UTC timestamp. */
export function getIsoWeekNumber(time: number) {
  const target = new Date(time);
  target.setUTCHours(0, 0, 0, 0);
  const dayNumber = target.getUTCDay() || 7; // Monday=1 ... Sunday=7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1);
  return Math.ceil(((target.getTime() - yearStart) / DAY_MS + 1) / 7);
}

/**
 * Monotonic index of the Monday-based week containing `time`.
 * Two timestamps share an ISO week exactly when their indexes are equal.
 * (1970-01-01 was a Thursday, hence the three-day shift back to Monday.)
 */
export function getWeekIndex(time: number) {
  return Math.floor((time + 3 * DAY_MS) / WEEK_MS);
}

/** UTC-midnight timestamp of the Monday starting the week of `time`. */
export function startOfWeekUtc(time: number) {
  return getWeekIndex(time) * WEEK_MS - 3 * DAY_MS;
}

/** UTC-midnight timestamp of the Friday in the week of `time`. */
export function getWeekFridayUtc(time: number) {
  return startOfWeekUtc(time) + 4 * DAY_MS;
}

/** `13-NOV-26` */
export function formatDayMonthYear(time: number) {
  const date = new Date(time);
  return `${pad2(date.getUTCDate())}-${MONTH_LABELS[date.getUTCMonth()]}-${String(date.getUTCFullYear()).slice(-2)}`;
}

/** `13-NOV` */
export function formatDayMonth(time: number) {
  const date = new Date(time);
  return `${pad2(date.getUTCDate())}-${MONTH_LABELS[date.getUTCMonth()]}`;
}

/** `NOV-09 - NOV-13` for the Monday-Friday span of the week containing `time`. */
export function formatWeekRange(time: number) {
  const start = new Date(startOfWeekUtc(time));
  const end = new Date(getWeekFridayUtc(time));
  return `${MONTH_LABELS[start.getUTCMonth()]}-${pad2(start.getUTCDate())} - ${MONTH_LABELS[end.getUTCMonth()]}-${pad2(end.getUTCDate())}`;
}
