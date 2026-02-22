import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ECONOMIC_WEEKS, type EconomicWeekEntry } from "../data/economicData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./EconomicData.css";

const HIGHLIGHT_TOKEN =
  /\[\[(?<actual>[^\]]+)\]\]|\[\((?<expected>[^)]+)\)\]|\[(?<change>[+-]?\d+(?:\.\d+)?)%\]/g;

type RailItem = {
  id: string;
  kind: "upcoming" | "past";
  weekNumber: number;
  year: number;
  dayMonthLabel: string | null;
  rangeLabel: string;
  headerDate: string;
  entry: EconomicWeekEntry | null;
};

function startOfWeekUtc(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekdayOffset = (start.getUTCDay() + 6) % 7; // Monday=0
  start.setUTCDate(start.getUTCDate() - weekdayOffset);
  return start;
}

function shiftDaysUtc(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function getIsoWeek(date: Date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7; // Monday=1 ... Sunday=7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatWeekRangeFromDate(date: Date) {
  const weekStart = startOfWeekUtc(date);
  const weekEnd = shiftDaysUtc(weekStart, 4);
  const monthStart = weekStart.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const dayStart = String(weekStart.getUTCDate()).padStart(2, "0");
  const monthEnd = weekEnd.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const dayEnd = String(weekEnd.getUTCDate()).padStart(2, "0");
  return `${monthStart}-${dayStart} - ${monthEnd}-${dayEnd}`;
}

function formatHeaderDateFromDate(date: Date) {
  const month = date
    .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
    .toUpperCase();
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function formatDayMonthFromHeaderDate(headerDate: string) {
  const [day = "--", month = "---"] = headerDate.split("-");
  return `${day}-${month}`;
}

function renderContentWithChangeBadges(content: string) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
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
      let variant = "economic-data__change--neutral";

      if (actual) {
        displayValue = actual.trim();
        variant = "economic-data__change--actual";
      } else if (expected) {
        displayValue = expected.trim();
        variant = "economic-data__change--expected";
      } else {
        const changeValue = Number(changeRaw ?? "0");
        variant =
          changeValue < 0
            ? "economic-data__change--negative"
            : changeValue > 0
              ? "economic-data__change--positive"
              : "economic-data__change--neutral";
        displayValue = `${changeRaw ?? "0"}%`;
      }

      if (displayValue) {
        lineElements.push(
          <span key={`line-${lineIndex}-badge-${lineElements.length}`} className={`economic-data__change ${variant}`}>
            {displayValue}
          </span>
        );
      }

      cursor = start + match[0].length;
    }

    if (cursor < line.length) {
      const textSegment = line.slice(cursor);
      if (textSegment) {
        lineElements.push(<span key={`line-${lineIndex}-tail-${lineElements.length}`}>{textSegment}</span>);
      }
    }

    nodes.push(
      <span key={`line-${lineIndex}`} className="economic-data__line">
        {lineElements.length > 0 ? lineElements : line}
      </span>
    );
  });

  return nodes;
}

function findAnchorIndex(activeSortDate: number) {
  const index = ECONOMIC_WEEKS.findIndex((entry) => entry.sortDate <= activeSortDate);
  if (index >= 0) return index;
  return ECONOMIC_WEEKS.length - 1;
}

function buildRailItems(activeSortDate: number): RailItem[] {
  if (ECONOMIC_WEEKS.length === 0) return [];

  const anchorIndex = findAnchorIndex(activeSortDate);
  const anchorEntry = ECONOMIC_WEEKS[anchorIndex];
  const anchorDate = new Date(anchorEntry.sortDate);
  const nextWeekDate = shiftDaysUtc(anchorDate, 7);

  const nextWeekStartMs = startOfWeekUtc(nextWeekDate).getTime();
  const upcomingEntry =
    ECONOMIC_WEEKS.find((entry) => startOfWeekUtc(new Date(entry.sortDate)).getTime() === nextWeekStartMs) ?? null;

  const upcomingItem: RailItem = {
    id: "upcoming",
    kind: "upcoming",
    weekNumber: getIsoWeek(nextWeekDate),
    year: nextWeekDate.getUTCFullYear(),
    dayMonthLabel: null,
    rangeLabel: formatWeekRangeFromDate(nextWeekDate),
    headerDate: upcomingEntry?.dateLabel ?? formatHeaderDateFromDate(nextWeekDate),
    entry: upcomingEntry,
  };

  const pastItems = ECONOMIC_WEEKS.slice(anchorIndex, anchorIndex + 5).map((entry) => {
    const entryDate = new Date(entry.sortDate);
    return {
      id: entry.id,
      kind: "past" as const,
      weekNumber: getIsoWeek(entryDate),
      year: entryDate.getUTCFullYear(),
      dayMonthLabel: formatDayMonthFromHeaderDate(entry.dateLabel),
      rangeLabel: formatWeekRangeFromDate(entryDate),
      headerDate: entry.dateLabel,
      entry,
    };
  });

  return [upcomingItem, ...pastItems];
}

export function EconomicData() {
  const { selected } = useNewsletterContext();

  const activeSortDate = selected?.sortDate ?? Date.now();
  const railItems = useMemo(() => buildRailItems(activeSortDate), [activeSortDate]);
  const activeWeekItemId =
    railItems.find((item) => item.kind === "past")?.id ?? railItems[0]?.id ?? "upcoming";
  const [selectedItemId, setSelectedItemId] = useState(activeWeekItemId);

  useEffect(() => {
    setSelectedItemId(activeWeekItemId);
  }, [activeWeekItemId]);

  const selectedItem = railItems.find((item) => item.id === selectedItemId) ?? railItems.find((item) => item.kind === "past") ?? railItems[0] ?? null;

  return (
    <div className="economic-data">
      <div className="economic-data__header">
        <span className="economic-data__titleBadge">Economic Data</span>
        <span className="economic-data__headerDate">{selectedItem?.headerDate ?? "-- --- --"}</span>
      </div>
      <div className="economic-data__body">
        <aside className="economic-data__rail" aria-label="Week selector">
          {railItems.map((item) => {
            const isSelected = item.id === selectedItem?.id;
            const buttonClasses = [
              "economic-data__railButton",
              item.kind === "upcoming" ? "economic-data__railButton--upcoming" : "",
              isSelected && item.kind === "upcoming" ? "is-selected-upcoming" : "",
              isSelected && item.kind === "past" ? "is-selected-past" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={item.id}
                type="button"
                className={buttonClasses}
                onClick={() => setSelectedItemId(item.id)}
                aria-pressed={isSelected}
              >
                <span
                  className={`economic-data__railWeekBadge ${
                    item.kind === "upcoming"
                      ? isSelected
                        ? "economic-data__railWeekBadge--upcomingSelected"
                        : "economic-data__railWeekBadge--upcoming"
                      : isSelected
                        ? "economic-data__railWeekBadge--pastSelected"
                        : "economic-data__railWeekBadge--past"
                  }`}
                >
                  {item.kind === "upcoming" ? (
                    "UPCOMING"
                  ) : (
                    <>
                      <span>{`WK ${String(item.weekNumber).padStart(2, "0")}`}</span>
                      <span className="economic-data__railWeekBadgeDate">{item.dayMonthLabel}</span>
                    </>
                  )}
                </span>
                <span className="economic-data__railYear">{item.year}</span>
                <span className="economic-data__railRange">{item.rangeLabel}</span>
              </button>
            );
          })}
        </aside>
        <section className="economic-data__detail">
          {selectedItem?.entry ? (
            <div className="economic-data__content">{renderContentWithChangeBadges(selectedItem.entry.content)}</div>
          ) : (
            <p className="economic-data__empty">
              No data block found for {selectedItem?.rangeLabel ?? "the selected week"} in
              `src/content/newsletters/economic-data.txt`.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
