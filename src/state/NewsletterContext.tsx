import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

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
    fullLabel: title ? `${monthStr}/${dayStr}/${yearStr} - ${title}` : dateLabel,
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

type NewsletterContextValue = {
  newsletters: NewsletterEntry[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  selected: NewsletterEntry | null;
};

const NewsletterContext = createContext<NewsletterContextValue | undefined>(undefined);

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const defaultId = NEWSLETTERS[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultId);

  const value = useMemo<NewsletterContextValue>(() => {
    const selected = NEWSLETTERS.find((entry) => entry.id === selectedId) ?? NEWSLETTERS[0] ?? null;
    return { newsletters: NEWSLETTERS, selectedId, setSelectedId, selected };
  }, [selectedId]);

  return <NewsletterContext.Provider value={value}>{children}</NewsletterContext.Provider>;
}

export function useNewsletterContext() {
  const ctx = useContext(NewsletterContext);
  if (!ctx) {
    throw new Error("useNewsletterContext must be used within NewsletterProvider");
  }
  return ctx;
}
