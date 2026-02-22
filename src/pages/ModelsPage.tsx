import { useMemo, useState, type ReactNode } from "react";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./ModelsPage.css";

type Tone = "positive" | "negative" | "neutral" | "actual" | "expected";

type EventLine = {
  lead: string;
  text: string;
  token?: string;
  tone?: Tone;
};

type EconEvent = {
  id: string;
  date: string;
  title: string;
  lines: EventLine[];
};

type Variant = {
  id: number;
  name: string;
  integration: "Low" | "Medium" | "High";
  dataInput: string;
  notes: string;
};

type WeekRailItem = {
  id: string;
  kind: "upcoming" | "past";
  title: string;
  weekLabel: string;
  dateLabel: string;
  highlights: ReadonlyArray<{
    label: string;
    value: string;
    tone: Tone;
  }>;
  notes: ReadonlyArray<string>;
};

const ECON_EVENTS: EconEvent[] = [
  {
    id: "e1",
    date: "Feb 21, 2026",
    title: "US PMI + Housing",
    lines: [
      { lead: "Manufacturing PMI", text: "beat consensus by", token: "+1.2", tone: "positive" },
      { lead: "Services PMI", text: "softened versus prior by", token: "-0.7", tone: "negative" },
      { lead: "Existing Home Sales", text: "printed", token: "4.05M", tone: "actual" },
    ],
  },
  {
    id: "e2",
    date: "Feb 14, 2026",
    title: "CPI + Retail",
    lines: [
      { lead: "Core CPI m/m", text: "came in at", token: "0.3%", tone: "actual" },
      { lead: "Headline CPI y/y", text: "vs. street", token: "2.9%", tone: "expected" },
      { lead: "Retail Sales", text: "missed by", token: "-0.4%", tone: "negative" },
    ],
  },
  {
    id: "e3",
    date: "Feb 07, 2026",
    title: "Payrolls + Wage",
    lines: [
      { lead: "Nonfarm Payrolls", text: "surprised to upside by", token: "+48K", tone: "positive" },
      { lead: "Unemployment Rate", text: "was unchanged at", token: "4.1%", tone: "neutral" },
      { lead: "Avg Hourly Earnings", text: "printed", token: "0.2%", tone: "actual" },
    ],
  },
];

const VARIANTS: Variant[] = [
  {
    id: 1,
    name: "Timeline Changelog",
    integration: "Low",
    dataInput: "Flat JSON list",
    notes: "Closest to your screenshot. Easiest weekly append workflow.",
  },
  {
    id: 2,
    name: "Date Buckets",
    integration: "Low",
    dataInput: "Grouped by week",
    notes: "Fast scan by date; very little custom state logic.",
  },
  {
    id: 3,
    name: "Terminal Tape",
    integration: "Medium",
    dataInput: "Line-oriented text",
    notes: "Strong visual identity; wrapping rules need stricter QA.",
  },
  {
    id: 4,
    name: "Matrix Grid",
    integration: "Medium",
    dataInput: "Indicator schema",
    notes: "Best for comparisons across releases; denser to maintain.",
  },
  {
    id: 5,
    name: "Signal Cards",
    integration: "Low",
    dataInput: "Card objects",
    notes: "Very modular; simple to extend with new datasets.",
  },
  {
    id: 6,
    name: "Accordion Feed",
    integration: "Medium",
    dataInput: "Sectioned payload",
    notes: "Great for long history; needs state persistence decisions.",
  },
  {
    id: 7,
    name: "Week Feed + Detail",
    integration: "Medium",
    dataInput: "Upcoming week + trailing 5 weeks",
    notes: "Left rail selection with a detail panel. Matches your requested weekly workflow.",
  },
  {
    id: 8,
    name: "Tag-first Browser",
    integration: "High",
    dataInput: "Tag index + events",
    notes: "Best discovery for large archives; requires search/filter index.",
  },
];

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

const UPCOMING_WEEK_HIGHLIGHTS = [
  { label: "Core PCE", value: "Street 0.3%", tone: "expected" as const },
  { label: "Claims", value: "Street 229K", tone: "expected" as const },
  { label: "ISM", value: "Street 50.4", tone: "expected" as const },
];

const PAST_WEEK_TEMPLATES = [
  [
    { label: "PMI", value: "+1.2", tone: "positive" as const },
    { label: "Retail", value: "-0.4%", tone: "negative" as const },
    { label: "Core CPI", value: "0.3%", tone: "actual" as const },
  ],
  [
    { label: "NFP", value: "+48K", tone: "positive" as const },
    { label: "U-Rate", value: "4.1%", tone: "neutral" as const },
    { label: "AHE", value: "0.2%", tone: "actual" as const },
  ],
  [
    { label: "ISM Mfg", value: "49.8", tone: "expected" as const },
    { label: "JOLTS", value: "-110K", tone: "negative" as const },
    { label: "Wage Rev", value: "+0.1", tone: "positive" as const },
  ],
  [
    { label: "GDP", value: "2.1%", tone: "actual" as const },
    { label: "PCE", value: "2.6%", tone: "expected" as const },
    { label: "Claims", value: "-8K", tone: "positive" as const },
  ],
  [
    { label: "Housing", value: "-0.7", tone: "negative" as const },
    { label: "LEI", value: "-0.2%", tone: "negative" as const },
    { label: "Sentiment", value: "+1.9", tone: "positive" as const },
  ],
];

function getIsoWeek(date: Date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function shiftUtcDays(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function formatDateShort(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = monthFormatter.format(date).toUpperCase();
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function buildWeekRailItems(activeDate: Date): WeekRailItem[] {
  const upcomingDate = shiftUtcDays(activeDate, 7);
  const upcomingItem: WeekRailItem = {
    id: "upcoming",
    kind: "upcoming",
    title: "Upcoming Week",
    weekLabel: `WK ${String(getIsoWeek(upcomingDate)).padStart(2, "0")}`,
    dateLabel: formatDateShort(upcomingDate),
    highlights: UPCOMING_WEEK_HIGHLIGHTS,
    notes: [
      "Forward-looking release set for the next week.",
      "Expected tags support pre-event positioning.",
    ],
  };

  const trailingItems: WeekRailItem[] = Array.from({ length: 5 }, (_, index) => {
    const pastDate = shiftUtcDays(activeDate, -7 * (index + 1));
    return {
      id: `past-${index + 1}`,
      kind: "past",
      title: `Past Week ${index + 1}`,
      weekLabel: `WK ${String(getIsoWeek(pastDate)).padStart(2, "0")}`,
      dateLabel: formatDateShort(pastDate),
      highlights: PAST_WEEK_TEMPLATES[index % PAST_WEEK_TEMPLATES.length],
      notes: [
        "Summary uses the same color language as the blog window.",
        "Keep weekly notes short for fast scan and maintenance.",
      ],
    };
  });

  return [upcomingItem, ...trailingItems];
}

function ToneToken({ tone, children }: { tone?: Tone; children: ReactNode }) {
  const toneClass = tone ? `models-page__token--${tone}` : "models-page__token--neutral";
  return <span className={`models-page__token ${toneClass}`}>{children}</span>;
}

function WeekRailDetailPreview() {
  const { selected } = useNewsletterContext();
  const [selectedItemId, setSelectedItemId] = useState("upcoming");

  const activeDate = useMemo(() => {
    if (!selected) {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    const current = new Date(selected.sortDate);
    return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate()));
  }, [selected]);

  const weekItems = useMemo(() => buildWeekRailItems(activeDate), [activeDate]);
  const activeItem = weekItems.find((item) => item.id === selectedItemId) ?? weekItems[0];

  return (
    <div className="models-page__railDetail">
      <aside className="models-page__rail" aria-label="Week selector">
        {weekItems.map((item) => {
          const isSelected = item.id === activeItem.id;
          const buttonClass = [
            "models-page__railBtn",
            item.kind === "upcoming" ? "models-page__railBtn--upcoming" : "",
            isSelected && item.kind === "upcoming" ? "is-selected-upcoming" : "",
            isSelected && item.kind === "past" ? "is-selected-past" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={item.id}
              type="button"
              className={buttonClass}
              onClick={() => setSelectedItemId(item.id)}
              aria-pressed={isSelected}
            >
              <span>{item.title}</span>
              <span className="models-page__date">
                {item.weekLabel} | {item.dateLabel}
              </span>
            </button>
          );
        })}
      </aside>
      <article className="models-page__detailPanel">
        <header className="models-page__historyHead">
          <span className="models-page__historyTag">{activeItem.weekLabel}</span>
          <span className="models-page__date">{activeItem.dateLabel}</span>
        </header>
        <h4 className="models-page__eventTitle">{activeItem.title} Details</h4>
        <div className="models-page__historyTokens">
          {activeItem.highlights.map((item) => (
            <ToneToken key={`${activeItem.id}-${item.label}`} tone={item.tone}>
              {item.label} {item.value}
            </ToneToken>
          ))}
        </div>
        <ul className="models-page__lineList">
          {activeItem.notes.map((note) => (
            <li key={`${activeItem.id}-${note}`}>{note}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}

function renderTimeline(events: EconEvent[]) {
  return (
    <div className="models-page__timeline">
      {events.map((event) => (
        <article className="models-page__timelineEvent" key={event.id}>
          <div className="models-page__timelineDot" aria-hidden="true" />
          <p className="models-page__date">{event.date}</p>
          <h4 className="models-page__eventTitle">{event.title}</h4>
          <ul className="models-page__lineList">
            {event.lines.map((line) => (
              <li key={`${event.id}-${line.lead}`}>
                <span className="models-page__lineLead">{line.lead}</span> {line.text}{" "}
                {line.token ? <ToneToken tone={line.tone}>{line.token}</ToneToken> : null}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function renderVariantPreview(id: number) {
  switch (id) {
    case 1:
      return renderTimeline(ECON_EVENTS);
    case 2:
      return (
        <div className="models-page__bucketFeed">
          {ECON_EVENTS.map((event) => (
            <section key={event.id} className="models-page__bucket">
              <header>
                <p className="models-page__date">{event.date}</p>
                <h4 className="models-page__eventTitle">{event.title}</h4>
              </header>
              {event.lines.map((line) => (
                <p key={`${event.id}-${line.lead}`} className="models-page__bucketLine">
                  <span className="models-page__lineLead">{line.lead}</span>
                  <span>{line.text}</span>
                  {line.token ? <ToneToken tone={line.tone}>{line.token}</ToneToken> : null}
                </p>
              ))}
            </section>
          ))}
        </div>
      );
    case 3:
      return (
        <div className="models-page__terminalFeed">
          {ECON_EVENTS.flatMap((event) => [
            <p key={`${event.id}-title`} className="models-page__terminalLine models-page__terminalLine--title">
              {">"} {event.date} | {event.title}
            </p>,
            ...event.lines.map((line) => (
              <p key={`${event.id}-${line.lead}`} className="models-page__terminalLine">
                - {line.lead}: {line.text}{" "}
                {line.token ? <ToneToken tone={line.tone}>{line.token}</ToneToken> : null}
              </p>
            )),
          ])}
        </div>
      );
    case 4:
      return (
        <table className="models-page__matrix">
          <thead>
            <tr>
              <th>Release</th>
              <th>Actual</th>
              <th>Street</th>
              <th>Delta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NFP</td>
              <td>
                <ToneToken tone="actual">228K</ToneToken>
              </td>
              <td>
                <ToneToken tone="expected">180K</ToneToken>
              </td>
              <td>
                <ToneToken tone="positive">+48K</ToneToken>
              </td>
            </tr>
            <tr>
              <td>Core CPI</td>
              <td>
                <ToneToken tone="actual">0.3%</ToneToken>
              </td>
              <td>
                <ToneToken tone="expected">0.3%</ToneToken>
              </td>
              <td>
                <ToneToken tone="neutral">0.0</ToneToken>
              </td>
            </tr>
            <tr>
              <td>Retail</td>
              <td>
                <ToneToken tone="actual">-0.4%</ToneToken>
              </td>
              <td>
                <ToneToken tone="expected">0.1%</ToneToken>
              </td>
              <td>
                <ToneToken tone="negative">-0.5</ToneToken>
              </td>
            </tr>
          </tbody>
        </table>
      );
    case 5:
      return (
        <div className="models-page__signalCards">
          {ECON_EVENTS.map((event) => (
            <article key={event.id} className="models-page__signalCard">
              <p className="models-page__date">{event.date}</p>
              <h4 className="models-page__eventTitle">{event.title}</h4>
              <div className="models-page__signalRow">
                {event.lines.map((line) =>
                  line.token ? (
                    <ToneToken key={`${event.id}-${line.lead}`} tone={line.tone}>
                      {`${line.lead}: ${line.token}`}
                    </ToneToken>
                  ) : null
                )}
              </div>
            </article>
          ))}
        </div>
      );
    case 6:
      return (
        <div className="models-page__accordion">
          {ECON_EVENTS.map((event, index) => (
            <details key={event.id} open={index === 0} className="models-page__accordionItem">
              <summary>
                <span>{event.title}</span>
                <span className="models-page__date">{event.date}</span>
              </summary>
              <div className="models-page__accordionBody">
                {event.lines.map((line) => (
                  <p key={`${event.id}-${line.lead}`}>
                    {line.lead}: {line.text}{" "}
                    {line.token ? <ToneToken tone={line.tone}>{line.token}</ToneToken> : null}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      );
    case 7:
      return <WeekRailDetailPreview />;
    case 8:
      return (
        <div className="models-page__tagBrowser">
          <div className="models-page__tagRow">
            <ToneToken tone="actual">CPI</ToneToken>
            <ToneToken tone="expected">NFP</ToneToken>
            <ToneToken tone="positive">PMI</ToneToken>
            <ToneToken tone="negative">Retail</ToneToken>
            <ToneToken tone="neutral">Housing</ToneToken>
          </div>
          {ECON_EVENTS.map((event) => (
            <article key={event.id} className="models-page__tagCard">
              <p className="models-page__date">{event.date}</p>
              <h4 className="models-page__eventTitle">{event.title}</h4>
              <p className="models-page__tagSummary">
                Tagged entry with release-level highlights and color-coded surprises.
              </p>
            </article>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function ModelsPage() {
  return (
    <section className="models-page">
      <div className="models-page__header">
        <h1 className="models-page__title">EconomicData Component Variations</h1>
        <p className="models-page__subtitle">
          Eight 1:2 scrollable concepts using your current color language and release-driven workflows.
        </p>
      </div>
      <div className="models-page__grid">
        {VARIANTS.map((variant) => (
          <article key={variant.id} className="models-page__variantCard">
            <header className="models-page__variantHeader">
              <h2 className="models-page__variantTitle">
                #{variant.id} {variant.name}
              </h2>
            </header>
            <div className="models-page__previewBox">{renderVariantPreview(variant.id)}</div>
            <dl className="models-page__meta">
              <div>
                <dt>Integration</dt>
                <dd>{variant.integration}</dd>
              </div>
              <div>
                <dt>Data Input</dt>
                <dd>{variant.dataInput}</dd>
              </div>
              <div>
                <dt>Note</dt>
                <dd>{variant.notes}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
