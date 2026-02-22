import economicDataRaw from "../content/newsletters/economic-data.txt?raw";

export type EconomicWeekEntry = {
  id: string;
  sortDate: number;
  dateLabel: string;
  content: string;
};

const HEADER_PATTERN = /^---\s*(\d{2})-([A-Z]{3})-(\d{2})\s*---$/i;

const MONTH_INDEX: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

function parseHeaderDate(headerLine: string) {
  const match = headerLine.match(HEADER_PATTERN);
  if (!match) return null;

  const [, dayRaw, monthRaw, yearRaw] = match;
  const day = Number(dayRaw);
  const month = MONTH_INDEX[monthRaw.toUpperCase()];
  const year = 2000 + Number(yearRaw);
  if (month === undefined) return null;

  const utcDate = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(utcDate.getTime())) return null;

  const dateLabel = `${dayRaw}-${monthRaw.toUpperCase()}-${yearRaw}`;
  return { sortDate: utcDate.getTime(), id: dateLabel, dateLabel };
}

function parseEconomicData(raw: string): EconomicWeekEntry[] {
  const lines = raw.split(/\r?\n/);
  const entries: EconomicWeekEntry[] = [];

  let currentMeta: { id: string; sortDate: number; dateLabel: string } | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentMeta) return;
    entries.push({
      ...currentMeta,
      content: currentLines.join("\n").trim(),
    });
    currentMeta = null;
    currentLines = [];
  };

  for (const line of lines) {
    const parsedHeader = parseHeaderDate(line.trim());
    if (parsedHeader) {
      flush();
      currentMeta = parsedHeader;
      continue;
    }

    if (!currentMeta) continue;
    currentLines.push(line);
  }

  flush();

  return entries.sort((a, b) => b.sortDate - a.sortDate);
}

export const ECONOMIC_WEEKS = parseEconomicData(economicDataRaw);
