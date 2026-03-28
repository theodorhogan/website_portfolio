export type EconomicEvent = {
  id: string;
  date: string;
  sortDate: number;
  weekday: number;
  weekdayLabel: string;
  country: string;
  event: string;
  actual: number | null;
  street: number | null;
  surprise: number | null;
  weekEndSortDate: number;
};

export type EconomicWeekEntry = {
  id: string;
  sortDate: number;
  dateLabel: string;
  weekStartDate: string;
  rangeLabel: string;
  events: EconomicEvent[];
};

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function startOfWeekUtc(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekdayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - weekdayOffset);
  return start;
}

function shiftDaysUtc(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function getWeekFridayUtc(date: Date) {
  return shiftDaysUtc(startOfWeekUtc(date), 4);
}

function formatDateLabel(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTH_LABELS[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function formatRangeLabel(weekStart: Date, weekEnd: Date) {
  const startMonth = MONTH_LABELS[weekStart.getUTCMonth()];
  const startDay = String(weekStart.getUTCDate()).padStart(2, "0");
  const endMonth = MONTH_LABELS[weekEnd.getUTCMonth()];
  const endDay = String(weekEnd.getUTCDate()).padStart(2, "0");
  return `${startMonth}-${startDay} - ${endMonth}-${endDay}`;
}

function parseEconomicEvents(rawCsv: string): EconomicEvent[] {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [headerLine, ...rows] = lines;
  if (!headerLine) return [];

  const headers = parseCsvLine(headerLine);
  const indexByHeader = new Map(headers.map((header, index) => [header, index]));

  return rows
    .map((line, rowIndex) => {
      const cells = parseCsvLine(line);
      const date = cells[indexByHeader.get("date") ?? -1] ?? "";
      const country = (cells[indexByHeader.get("country") ?? -1] ?? "").trim() || "US";
      const event = cells[indexByHeader.get("event") ?? -1] ?? "";
      const actual = parseNumber(cells[indexByHeader.get("actual") ?? -1] ?? "");
      const street = parseNumber(cells[indexByHeader.get("street") ?? -1] ?? "");
      const surprise = parseNumber(cells[indexByHeader.get("surprise") ?? -1] ?? "");

      const eventDate = new Date(`${date}T00:00:00Z`);
      if (Number.isNaN(eventDate.getTime()) || !event) {
        return null;
      }

      const weekEnd = getWeekFridayUtc(eventDate);

      return {
        id: `${date}-${rowIndex}-${event}`,
        date,
        sortDate: eventDate.getTime(),
        weekday: eventDate.getUTCDay(),
        weekdayLabel: WEEKDAY_LABELS[eventDate.getUTCDay()],
        country,
        event,
        actual,
        street,
        surprise,
        weekEndSortDate: weekEnd.getTime(),
      } satisfies EconomicEvent;
    })
    .filter((entry): entry is EconomicEvent => entry !== null)
    .sort((a, b) => a.sortDate - b.sortDate || a.event.localeCompare(b.event));
}

const economicCalendarCsv = import.meta.glob("../content/econcalendar/economic-calendar.csv", {
  eager: true,
  import: "default",
  query: "?raw",
});

const RAW_ECONOMIC_CALENDAR = Object.values(economicCalendarCsv).join("\n");

export const ECONOMIC_EVENTS = parseEconomicEvents(RAW_ECONOMIC_CALENDAR);

export const ECONOMIC_WEEKS: EconomicWeekEntry[] = Array.from(
  ECONOMIC_EVENTS.reduce((map, event) => {
    const existing = map.get(event.weekEndSortDate);
    if (existing) {
      existing.events.push(event);
      return map;
    }

    const weekEnd = new Date(event.weekEndSortDate);
    const weekStart = shiftDaysUtc(weekEnd, -4);

    map.set(event.weekEndSortDate, {
      id: formatDateLabel(weekEnd),
      sortDate: event.weekEndSortDate,
      dateLabel: formatDateLabel(weekEnd),
      weekStartDate: weekStart.toISOString().slice(0, 10),
      rangeLabel: formatRangeLabel(weekStart, weekEnd),
      events: [event],
    });
    return map;
  }, new Map<number, EconomicWeekEntry>()).values(),
)
  .map((entry) => ({
    ...entry,
    events: [...entry.events].sort((a, b) => a.sortDate - b.sortDate || a.event.localeCompare(b.event)),
  }))
  .sort((a, b) => b.sortDate - a.sortDate);
