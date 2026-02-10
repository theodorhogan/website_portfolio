import type { ReactNode } from "react";
import "./BlogWindow.css";
import { useNewsletterContext } from "../state/NewsletterContext";

const HIGHLIGHT_TOKEN =
  /\[\[(?<actual>[^\]]+)\]\]|\[\((?<expected>[^)]+)\)\]|\[(?<sign>[+-])?(?<value>\d+(?:\.\d+)?)%\]/g;

function renderContentWithChangeBadges(content: string) {
  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const lineElements: ReactNode[] = [];
    let cursor = 0;

    for (const match of line.matchAll(HIGHLIGHT_TOKEN)) {
      const start = match.index ?? 0;

      if (start > cursor) {
        const textSegment = line.slice(cursor, start);

        if (textSegment) {
          lineElements.push(
            <span
              key={`line-${lineIndex}-text-${lineElements.length}`}
            >
              {textSegment}
            </span>
          );
        }
      }

      const actual = match.groups?.actual;
      const expected = match.groups?.expected;
      const sign = match.groups?.sign ?? null;
      const value = match.groups?.value ?? "";

      let displayValue = "";
      let variant = "blog-window__change--neutral";

      if (actual) {
        displayValue = actual.trim();
        variant = "blog-window__change--actual";
      } else if (expected) {
        displayValue = expected.trim();
        variant = "blog-window__change--expected";
      } else {
        variant =
          sign === "-"
            ? "blog-window__change--negative"
            : sign === "+"
              ? "blog-window__change--positive"
              : "blog-window__change--neutral";
        displayValue = `${sign ?? ""}${value}%`;
      }

      if (!displayValue) {
        cursor = start + match[0].length;
        continue;
      }

      lineElements.push(
        <span
          key={`line-${lineIndex}-badge-${lineElements.length}`}
          className={`blog-window__change ${variant}`}
        >
          {displayValue}
        </span>
      );

      cursor = start + match[0].length;
    }

    if (cursor < line.length) {
      const textSegment = line.slice(cursor);

      if (textSegment) {
        lineElements.push(
          <span
            key={`line-${lineIndex}-text-${lineElements.length}`}
          >
            {textSegment}
          </span>
        );
      }
    }

    if (lineElements.length === 0) {
      lineElements.push(
        <span key={`line-${lineIndex}-empty`}>{"\u00A0"}</span>
      );
    }

    nodes.push(
      <span key={`line-${lineIndex}`}>{lineElements}</span>
    );

    if (lineIndex < lines.length - 1) {
      nodes.push(<br key={`line-break-${lineIndex}`} />);
    }
  });

  return nodes;
}

export function BlogWindow() {
  const { newsletters, selected, setSelectedId } = useNewsletterContext();

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
        <div className="blog-window__content">
          {renderContentWithChangeBadges(selected.content)}
        </div>
      </div>
    </div>
  );
}
