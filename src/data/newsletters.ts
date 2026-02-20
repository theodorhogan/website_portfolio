export type NewsletterEntry = {
  id: string;
  fileName: string;
  dateLabel: string;
  fullLabel: string;
  content: string;
  sortDate: number;
};

function parseNewsletterPath(path: string, rawContent: string): NewsletterEntry | null {
  const file = path.split("/").at(-1)?.replace(".txt", "") ?? "";
  const match = file.match(/^(\d{2})-(\d{2})-(\d{2}) - (.+)$/);
  if (!match) return null;

  const [, monthStr, dayStr, yearStr, title] = match;
  const month = Number(monthStr);
  const day = Number(dayStr);
  const year = 2000 + Number(yearStr);
  const isoDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(isoDate.getTime())) return null;

  const dateLabel = `${monthStr}/${dayStr}/${yearStr}`;
  return {
    id: `${monthStr}-${dayStr}-${yearStr}`,
    fileName: file,
    dateLabel,
    fullLabel: title ? `${dateLabel} - ${title}` : dateLabel,
    content: rawContent.trim(),
    sortDate: isoDate.getTime(),
  };
}

const newsletterModules = import.meta.glob("../content/newsletters/*.txt", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const NEWSLETTERS: NewsletterEntry[] = Object.entries(newsletterModules)
  .map(([path, moduleContent]) => parseNewsletterPath(path, moduleContent as string))
  .filter((entry): entry is NewsletterEntry => entry !== null)
  .sort((a, b) => b.sortDate - a.sortDate);
