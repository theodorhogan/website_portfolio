import { useMemo } from "react";
import {
  formatForwardPe,
  getEarningsCalendarWeeks,
  getEarningsWeeks,
  getForwardPe,
  type EarningsWeek,
} from "../data/earningsData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { formatDayMonth, getWeekFridayUtc, startOfWeekUtc } from "../utils/dates";
import { formatPrice } from "../utils/format";
import { getAlignedPoint } from "../utils/timeSeries";
import { PanelShell } from "./PanelShell";
import "./EarningsCalendar.css";

/** A headline figure; a null `value` renders as `--` and never carries a note. */
type StatTile = {
  label: string;
  value: string | null;
  note: string | null;
};

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/** The calendar's `when` codes; anything else prints as `--`. */
const WHEN_LABELS: Record<string, string> = {
  "before-open": "PRE-MARKET",
  "pre-market": "PRE-MARKET",
  "after-close": "AFTER CLOSE",
};

const marketCapFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `2026Q3` -> `Q3 2026`. */
function formatSeason(season: string) {
  const match = season.match(/^(\d{4})Q([1-4])$/);
  return match ? `Q${match[2]} ${match[1]}` : season;
}

/** `83.8%`, or `+34.3%` when signed. */
function formatPercent(value: number, signed = false) {
  const rounded = Math.round(value * 10) / 10;
  return `${signed && rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`;
}

/** `$1.09`, `-$0.32`, or `--` when missing. */
function formatDollars(value: number | null) {
  if (value === null) return "--";
  const amount = Math.abs(value).toFixed(2);
  return `${value < 0 && Number(amount) !== 0 ? "-" : ""}$${amount}`;
}

/** `MON 30-NOV` */
function formatReportDay(time: number) {
  return `${WEEKDAY_LABELS[new Date(time).getUTCDay()]} ${formatDayMonth(time)}`;
}

function tile(label: string, value: string | null, note: string | null = null): StatTile {
  return { label, value, note: value === null ? null : note };
}

function buildTiles(week: EarningsWeek | null, activeTime: number | null): StatTile[] {
  const reported = week?.reported ?? null;
  const total = week?.total ?? null;
  const nextWeek = week?.reportingNextWeek ?? null;
  const beat = week?.beatPct ?? null;
  const beatLongRun = week?.beatPctLongRun ?? null;
  const growth = week?.epsGrowthPct ?? null;
  const growthExEnergy = week?.epsGrowthExEnergyPct ?? null;
  const forwardEps = week?.fwd4qEps ?? null;

  return [
    tile("Season", week?.season ? formatSeason(week.season) : null),
    tile(
      "S&P 500 reported",
      reported !== null && total !== null ? `${reported} / ${total}` : null,
      nextWeek !== null ? `${nextWeek} ${nextWeek === 1 ? "reports" : "report"} next week` : null,
    ),
    tile(
      "Beat EPS estimate",
      beat !== null ? formatPercent(beat) : null,
      beatLongRun !== null ? `Long-run average ${formatPercent(beatLongRun)}` : null,
    ),
    tile(
      "EPS growth, y/y",
      growth !== null ? formatPercent(growth, true) : null,
      growthExEnergy !== null ? `${formatPercent(growthExEnergy, true)} excluding energy` : null,
    ),
    tile(
      "4Q forward EPS",
      forwardEps !== null ? formatPrice(forwardEps) : null,
      activeTime !== null ? `P/E ${formatForwardPe(getForwardPe("SPX", activeTime))}` : null,
    ),
  ];
}

/** Season figures, next week's reporting companies and season progress for the active week. */
export function EarningsCalendar() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const { tiles, rows, progress } = useMemo(() => {
    const week = activeTime === null ? null : getAlignedPoint(getEarningsWeeks(), activeTime);
    const calendar = activeTime === null ? null : getAlignedPoint(getEarningsCalendarWeeks(), activeTime);
    const reported = week?.reported ?? null;
    const total = week?.total ?? null;

    return {
      tiles: buildTiles(week, activeTime),
      rows: calendar?.rows ?? [],
      progress:
        reported !== null && total !== null && total > 0
          ? { reported, total, share: Math.min(Math.max(reported / total, 0), 1) }
          : null,
    };
  }, [activeTime]);

  return (
    <PanelShell className="earnings-calendar" variant="standard" bodyMode="fit" badge="EARNINGS CALENDAR">
      <dl className="earnings-calendar__tiles">
        {tiles.map((item) => (
          <div key={item.label} className="earnings-calendar__tile">
            <dt className="earnings-calendar__tileLabel">{item.label}</dt>
            <dd
              className={`earnings-calendar__tileValue${item.value === null ? " earnings-calendar__tileValue--missing" : ""}`}
            >
              {item.value ?? "--"}
            </dd>
            {item.note ? <dd className="earnings-calendar__tileNote">{item.note}</dd> : null}
          </div>
        ))}
      </dl>

      {rows.length > 0 ? (
        <>
          <div className="earnings-calendar__heading">
            <span className="earnings-calendar__headingTitle">REPORTING NEXT WEEK</span>
            {/* Monday to Friday of the week the rows fall in. */}
            <span className="earnings-calendar__headingRange">
              {formatDayMonth(startOfWeekUtc(rows[0].time))} to {formatDayMonth(getWeekFridayUtc(rows[0].time))}
            </span>
          </div>
          <div className="earnings-calendar__tableWrap">
            <table className="earnings-calendar__table" aria-label="Companies reporting next week">
              <thead>
                <tr>
                  <th scope="col" className="earnings-calendar__head">Day</th>
                  <th scope="col" className="earnings-calendar__head">Ticker</th>
                  <th scope="col" className="earnings-calendar__head">Company</th>
                  <th scope="col" className="earnings-calendar__head">When</th>
                  <th scope="col" className="earnings-calendar__head earnings-calendar__head--number">EPS Est</th>
                  <th scope="col" className="earnings-calendar__head earnings-calendar__head--number"># Est</th>
                  <th scope="col" className="earnings-calendar__head earnings-calendar__head--number">Year Ago</th>
                  <th scope="col" className="earnings-calendar__head earnings-calendar__head--number">Mkt Cap $bn</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.date}-${row.ticker}`}>
                    <td className="earnings-calendar__day">
                      {rows[index - 1]?.time === row.time ? null : formatReportDay(row.time)}
                    </td>
                    <th scope="row" className="earnings-calendar__ticker">{row.ticker}</th>
                    <td className="earnings-calendar__company">{row.name}</td>
                    <td className="earnings-calendar__when">{WHEN_LABELS[row.when ?? ""] ?? "--"}</td>
                    <td className="earnings-calendar__number">{formatDollars(row.epsEstimate)}</td>
                    <td className="earnings-calendar__number earnings-calendar__number--dim">
                      {row.estimates ?? "--"}
                    </td>
                    <td className="earnings-calendar__number earnings-calendar__number--dim">
                      {formatDollars(row.epsYearAgo)}
                    </td>
                    <td className="earnings-calendar__number">
                      {row.marketCapBn === null ? "--" : marketCapFormatter.format(row.marketCapBn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="earnings-calendar__empty">No earnings calendar for the selected week.</p>
      )}

      {progress ? (
        <div className="earnings-calendar__progress">
          <div className="earnings-calendar__progressHead">
            <span className="earnings-calendar__progressLabel">S&P 500 COMPANIES REPORTED</span>
            <span className="earnings-calendar__progressCount">
              {progress.reported} of {progress.total}
            </span>
          </div>
          <div className="earnings-calendar__progressTrack" aria-hidden="true">
            <div className="earnings-calendar__progressFill" style={{ width: `${progress.share * 100}%` }} />
          </div>
        </div>
      ) : null}
    </PanelShell>
  );
}
