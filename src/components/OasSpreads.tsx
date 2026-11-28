import { lazy } from "../data/csvStore";
import { CREDIT_SPREAD_ORDER, getCreditSpreadSeries } from "../data/ratesData";
import { CycleTable } from "./CycleTable";
import type { CycleSeriesRow } from "./cycleWindow";

const getRows = lazy((): CycleSeriesRow[] => {
  const seriesByRating = getCreditSpreadSeries();
  return CREDIT_SPREAD_ORDER.map((rating) => ({ label: rating, series: seriesByRating.get(rating) ?? [] }));
});

export function OasSpreads() {
  return (
    <CycleTable
      badge="OAS"
      ariaLabel="Credit spreads OAS"
      rowHeaderLabel="RATING"
      rows={getRows()}
      decimals={0}
      suffix="bp"
    />
  );
}
