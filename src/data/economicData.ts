export type EconomicWeekEntry = {
  id: string;
  sortDate: number;
  dateLabel: string;
  content: string;
  fileName: string;
};

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatDateLabel(day: number, month: number, year2: number) {
  const dayLabel = String(day).padStart(2, "0");
  return `${dayLabel}-${MONTH_LABELS[month]}-${String(year2).padStart(2, "0")}`;
}

function parseEconomicWeekPath(path: string, rawContent: string): EconomicWeekEntry | null {
  const fileName = path.split("/").at(-1)?.replace(".txt", "") ?? "";
  const match = fileName.match(/^(\d{2})-(\d{2})-(\d{2})(?:\s*-\s*.+)?$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year2 = Number(match[3]);
  const year = 2000 + year2;
  const sortDate = Date.UTC(year, month - 1, day);
  if (Number.isNaN(sortDate)) return null;

  return {
    id: `${match[1]}-${match[2]}-${match[3]}`,
    sortDate,
    dateLabel: formatDateLabel(day, month - 1, year2),
    content: rawContent.trim(),
    fileName,
  };
}

const economicWeekModules = import.meta.glob("../content/econcalendar/*.txt", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const ECONOMIC_WEEKS: EconomicWeekEntry[] = Object.entries(economicWeekModules)
  .map(([path, moduleContent]) => parseEconomicWeekPath(path, moduleContent as string))
  .filter((entry): entry is EconomicWeekEntry => entry !== null)
  .sort((a, b) => b.sortDate - a.sortDate);
