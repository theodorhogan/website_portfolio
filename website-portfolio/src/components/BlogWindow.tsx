import { useMemo, useState } from "react";
import "./BlogWindow.css";

type NewsletterEntry = {
  id: string;
  fileName: string;
  dateLabel: string;
  fullLabel: string;
  content: string;
  sortDate: number;
};

function parseNewsletterPath(
  path: string,
  rawContent: string
): NewsletterEntry | null {
  const pathSegments = path.split("/");
  const file = pathSegments[pathSegments.length - 1]?.replace(".txt", "") ?? "";
  const match = file.match(/^(\d{2})-(\d{2})-(\d{2}) - (.+)$/);

  if (!match) {
    return null;
  }

  const [, monthStr, dayStr, yearStr, title] = match;
  const month = Number(monthStr);
  const day = Number(dayStr);
  const year = 2000 + Number(yearStr);
  const isoDate = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(isoDate.getTime())) {
    return null;
  }

  const dateLabel = `${monthStr}/${dayStr}/${yearStr}`;

  return {
    id: `${monthStr}-${dayStr}-${yearStr}`,
    fileName: file,
    dateLabel,
    fullLabel: title
      ? `${monthStr}/${dayStr}/${yearStr} - ${title}`
      : `${monthStr}/${dayStr}/${yearStr}`,
    content: rawContent.trim(),
    sortDate: isoDate.getTime(),
  };
}

const newsletterModules = import.meta.glob("../content/newsletters/*.txt", {
  eager: true,
  import: "default",
  query: "?raw",
});

const NEWSLETTERS: NewsletterEntry[] = Object.entries(newsletterModules)
  .map(([path, moduleContent]) => {
    const rawContent = moduleContent as string;
    return parseNewsletterPath(path, rawContent);
  })
  .filter((entry): entry is NewsletterEntry => entry !== null)
  .sort((a, b) => b.sortDate - a.sortDate);

export function BlogWindow() {
  const newsletters = useMemo(() => NEWSLETTERS, []);

  const initialId = newsletters[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);

  const selected =
    newsletters.find((entry) => entry.id === selectedId) ?? newsletters[0];

  if (!selected) {
    return (
      <div className="blog-window">
        <div className="blog-window__header">
          <span className="blog-window__titleText">
            News – no bulletins found
          </span>
        </div>
        <div className="blog-window__body">
          <p className="blog-window__empty">
            Drop weekly `.txt` files into `src/content/newsletters` to populate
            this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-window">
      <div className="blog-window__header">
        <div className="blog-window__titleGroup">
          <span className="blog-window__titleBadge">Market Update</span>
          <span className="blog-window__titleText">{selected.fileName}</span>
        </div>
        <label className="blog-window__selectGroup">
          <span className="sr-only">Select bulletin by date</span>
          <select
            className="blog-window__select"
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {newsletters.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.dateLabel}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="blog-window__body"
        role="article"
        aria-label={selected.fullLabel}
      >
        <pre className="blog-window__content">{selected.content}</pre>
      </div>
    </div>
  );
}
