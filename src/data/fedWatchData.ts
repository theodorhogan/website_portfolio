import fedWatchJson from "../content/data/fedwatch.json?raw";
import { parseIsoDateToUtcTime } from "../utils/dates";
import { lazy } from "./csvStore";

/**
 * What the fed funds futures price for the next FOMC meeting, one entry per
 * bulletin week. Computed by the pipeline from the same futures the ZQ panels show.
 */
export type FedWatchWeek = {
  time: number;
  week: string;
  /** ISO date of the decision day. */
  meeting: string;
  meetingTime: number;
  /** Whether the meeting comes with economic projections; null when the Fed has not said yet. */
  projections: boolean | null;
  preRate: number | null;
  postRate: number | null;
  /** The five probabilities add up to 1. All are null in a week pricing more than two 25bp steps. */
  hike50: number | null;
  hike25: number | null;
  hold: number | null;
  cut25: number | null;
  cut50: number | null;
};

export const getFedWatchWeeks = lazy((): FedWatchWeek[] => {
  const parsed = JSON.parse(fedWatchJson) as { weeks: Array<Omit<FedWatchWeek, "time" | "meetingTime">> };

  return (parsed.weeks ?? [])
    .map((week) => ({
      ...week,
      time: parseIsoDateToUtcTime(week.week),
      meetingTime: parseIsoDateToUtcTime(week.meeting),
    }))
    .filter((week): week is FedWatchWeek => week.time !== null && week.meetingTime !== null)
    .sort((a, b) => a.time - b.time);
});
