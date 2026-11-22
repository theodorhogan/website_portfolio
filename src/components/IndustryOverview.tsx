import { Fragment, useMemo } from "react";
import { INDUSTRIES, getIndustrySeries, type PricePoint } from "../data/equityData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS } from "../utils/dates";
import { formatPercentChange, formatPrice, getChangeTone, type ChangeTone } from "../utils/format";
import { computePercentChange, getAlignedPoint } from "../utils/timeSeries";
import { PanelShell } from "./PanelShell";
import "./IndustryOverview.css";

type RegionMetrics = {
  price: string;
  weekChange: string;
  weekTone: ChangeTone;
  lastWeekChange: string;
  lastWeekTone: ChangeTone;
};

const EMPTY_METRICS: RegionMetrics = {
  price: "--",
  weekChange: "--",
  weekTone: "neutral",
  lastWeekChange: "--",
  lastWeekTone: "neutral",
};

const REGIONS = ["us", "eu"] as const;

function computeRegionMetrics(series: PricePoint[], activeTime: number | null): RegionMetrics {
  const current = activeTime === null ? null : getAlignedPoint(series, activeTime);
  if (activeTime === null || !current) return EMPTY_METRICS;

  const lastWeek = getAlignedPoint(series, activeTime - WEEK_MS)?.value ?? null;
  const twoWeeks = getAlignedPoint(series, activeTime - 2 * WEEK_MS)?.value ?? null;
  const weekChange = computePercentChange(current.value, lastWeek);
  const lastWeekChange = computePercentChange(lastWeek, twoWeeks);

  return {
    price: formatPrice(current.value),
    weekChange: formatPercentChange(weekChange),
    weekTone: getChangeTone(weekChange),
    lastWeekChange: formatPercentChange(lastWeekChange, true),
    lastWeekTone: getChangeTone(lastWeekChange),
  };
}

export function IndustryOverview() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const rows = useMemo(() => {
    const seriesById = getIndustrySeries();
    return INDUSTRIES.map((industry) => {
      const series = seriesById.get(industry.id);
      return {
        id: industry.id,
        label: industry.label,
        us: computeRegionMetrics(series?.us ?? [], activeTime),
        eu: computeRegionMetrics(series?.eu ?? [], activeTime),
      };
    });
  }, [activeTime]);

  return (
    <PanelShell
      className="industry-overview"
      variant="standard"
      bodyMode="scroll"
      badge="INDUSTRY"
      title="Overview - US vs EU"
      meta="Sector ETFs - Week on Week"
      bodyClassName="industry-overview__body"
    >
      <table className="industry-overview__table" aria-label="Industry overview US versus EU">
        <thead>
          <tr>
            <th scope="col" className="industry-overview__headSpacer" aria-label="Industry" />
            <th scope="colgroup" colSpan={3} className="industry-overview__headRegion">
              US
            </th>
            <th scope="colgroup" colSpan={3} className="industry-overview__headRegion industry-overview__cellDivider">
              EU
            </th>
          </tr>
          <tr>
            <th scope="col" className="industry-overview__headSpacer" aria-label="Industry name" />
            {REGIONS.map((region) => (
              <Fragment key={region}>
                <th
                  scope="col"
                  className={`industry-overview__headNumber${region === "eu" ? " industry-overview__cellDivider" : ""}`}
                >
                  Price
                </th>
                <th scope="col" className="industry-overview__headNumber">% Chg</th>
                <th scope="col" className="industry-overview__headNumber">[% Last Wk]</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="industry-overview__industry">{row.label}</td>
              {REGIONS.map((region) => (
                <Fragment key={region}>
                  <td
                    className={`industry-overview__number${region === "eu" ? " industry-overview__cellDivider" : ""}`}
                  >
                    {row[region].price}
                  </td>
                  <td className={`industry-overview__change industry-overview__change--${row[region].weekTone}`}>
                    {row[region].weekChange}
                  </td>
                  <td className={`industry-overview__change industry-overview__change--${row[region].lastWeekTone}`}>
                    {row[region].lastWeekChange}
                  </td>
                </Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
