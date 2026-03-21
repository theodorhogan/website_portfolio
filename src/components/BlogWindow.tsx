import type { ReactNode } from "react";
import "./BlogWindow.css";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { PanelShell } from "./PanelShell";

const HIGHLIGHT_TOKEN =
  /\[\[(?<actual>[^\]]+)\]\]|\[\((?<expected>[^)]+)\)\]|\[(?<change>[+-]?\d+(?:\.\d+)?)%\]/g;

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
          lineElements.push(<span key={`line-${lineIndex}-text-${lineElements.length}`}>{textSegment}</span>);
        }
      }

      const actual = match.groups?.actual;
      const expected = match.groups?.expected;
      const changeRaw = match.groups?.change;

      let displayValue = "";
      let variant = "blog-window__change--neutral";

      if (actual) {
        displayValue = actual.trim();
        variant = "blog-window__change--actual";
      } else if (expected) {
        displayValue = expected.trim();
        variant = "blog-window__change--expected";
      } else {
        const changeValue = Number(changeRaw ?? "0");
        variant =
          changeValue < 0
            ? "blog-window__change--negative"
            : changeValue > 0
              ? "blog-window__change--positive"
              : "blog-window__change--neutral";
        displayValue = `${changeRaw ?? "0"}%`;
      }

      if (!displayValue) {
        cursor = start + match[0].length;
        continue;
      }

      lineElements.push(
        <span key={`line-${lineIndex}-badge-${lineElements.length}`} className={`blog-window__change ${variant}`}>
          {displayValue}
        </span>,
      );

      cursor = start + match[0].length;
    }

    if (cursor < line.length) {
      const textSegment = line.slice(cursor);

      if (textSegment) {
        lineElements.push(<span key={`line-${lineIndex}-text-${lineElements.length}`}>{textSegment}</span>);
      }
    }

    if (lineElements.length === 0) {
      lineElements.push(<span key={`line-${lineIndex}-empty`}>{"\u00A0"}</span>);
    }

    nodes.push(<span key={`line-${lineIndex}`}>{lineElements}</span>);

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
      <PanelShell
        className="blog-window h-full"
        variant="standard"
        bodyMode="scroll"
        badge="Market Update"
        title={<span className="blog-window__titleText">News - no bulletins found</span>}
        bodyClassName="blog-window__body"
      >
        <p className="blog-window__empty">
          Drop weekly `.txt` files into `src/content/newsletters` to populate this window.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      className="blog-window h-full"
      variant="standard"
      bodyMode="scroll"
      badge="Market Update"
      title={<span className="blog-window__titleText">{selected.fileName}</span>}
      actions={
        <label className="blog-window__selectGroup">
          <span className="sr-only">Select bulletin by date</span>
          <select className="blog-window__select" value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
            {newsletters.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.dateLabel}
              </option>
            ))}
          </select>
        </label>
      }
      bodyClassName="blog-window__body"
    >
      <div role="article" aria-label={selected.fullLabel}>
        <div className="blog-window__content">{renderContentWithChangeBadges(selected.content)}</div>
      </div>
    </PanelShell>
  );
}
