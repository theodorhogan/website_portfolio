import { useMemo } from "react";
import { getFedWatchWeeks } from "../data/fedWatchData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { DAY_MS, WEEK_MS, formatDayMonthYear } from "../utils/dates";
import type { ChangeTone } from "../utils/format";
import { getAlignedPoint } from "../utils/timeSeries";
import { PanelShell } from "./PanelShell";
import "./FedWatch.css";

type OutcomeKey = "hike50" | "hike25" | "hold" | "cut25" | "cut50";

/** A rise in rates is the bad outcome, as elsewhere on the site. */
const OUTCOMES: ReadonlyArray<{ key: OutcomeKey; label: string; tone: ChangeTone }> = [
  { key: "hike50", label: "HIKE 50", tone: "negative" },
  { key: "hike25", label: "HIKE 25", tone: "negative" },
  { key: "hold", label: "HOLD", tone: "neutral" },
  { key: "cut25", label: "CUT 25", tone: "positive" },
  { key: "cut50", label: "CUT 50", tone: "positive" },
];

function toPercent(probability: number | null) {
  return probability === null ? null : Math.round(probability * 100);
}

function formatPercent(percent: number | null, bracketed = false) {
  if (percent === null) return "--";
  return bracketed ? `[${percent}%]` : `${percent}%`;
}

function formatDaysAway(days: number) {
  if (days === 0) return "TODAY";
  const count = `${Math.abs(days)} ${Math.abs(days) === 1 ? "DAY" : "DAYS"}`;
  return days > 0 ? `IN ${count}` : `${count} AGO`;
}

export function FedWatch() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const view = useMemo(() => {
    if (activeTime === null) return null;

    const weeks = getFedWatchWeeks();
    const week = getAlignedPoint(weeks, activeTime);
    if (!week) return null;

    // Last week's odds are only comparable when they were for the same meeting.
    const weekEarlier = getAlignedPoint(weeks, activeTime - WEEK_MS);
    const lastWeek = weekEarlier?.meeting === week.meeting ? weekEarlier : null;

    // Hold always shows; another outcome only when it is priced this week or was last week.
    // A week without probabilities (more than two steps priced) lists all five as "--".
    const rows = OUTCOMES.map((outcome) => ({
      ...outcome,
      percent: toPercent(week[outcome.key]),
      lastWeekPercent: lastWeek ? toPercent(lastWeek[outcome.key]) : null,
    })).filter(
      (row) => row.key === "hold" || row.percent === null || row.percent > 0 || (row.lastWeekPercent ?? 0) > 0,
    );

    return {
      meetingTime: week.meetingTime,
      daysAway: Math.round((week.meetingTime - activeTime) / DAY_MS),
      withProjections: week.projections === true,
      rows,
    };
  }, [activeTime]);

  return (
    <PanelShell className="fed-watch" variant="standard" bodyMode="fit" badge="FED WATCH">
      {view ? (
        <>
          <div className="fed-watch__meeting">
            <span className="fed-watch__label">Next FOMC</span>
            <span className="fed-watch__date">{formatDayMonthYear(view.meetingTime)}</span>
            <span className="fed-watch__countdown">{formatDaysAway(view.daysAway)}</span>
            {view.withProjections ? <span className="fed-watch__note">with projections</span> : null}
          </div>
          <table className="fed-watch__table" aria-label="Probabilities for the next FOMC decision">
            <thead>
              <tr>
                <th scope="col" className="fed-watch__head fed-watch__head--outcome">
                  Outcome
                </th>
                <td className="fed-watch__head fed-watch__head--bar" />
                <th scope="col" className="fed-watch__head">
                  This Wk
                </th>
                <th scope="col" className="fed-watch__head">
                  [Last Wk]
                </th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className="fed-watch__outcome">
                    {row.label}
                  </th>
                  <td className="fed-watch__barCell" aria-hidden="true">
                    {row.percent !== null ? (
                      <span className="fed-watch__track">
                        <span
                          className={`fed-watch__fill fed-watch__fill--${row.tone}`}
                          style={{ width: `${row.percent}%` }}
                        />
                      </span>
                    ) : null}
                  </td>
                  <td className="fed-watch__percent">{formatPercent(row.percent)}</td>
                  <td className="fed-watch__lastWeek">{formatPercent(row.lastWeekPercent, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="fed-watch__empty">No Fed Watch data for the selected week.</p>
      )}
    </PanelShell>
  );
}
