import { lazy } from "../data/csvStore";
import { getBreakevenSeries } from "../data/ratesData";
import { CycleTable } from "./CycleTable";
import { getCurveRows } from "./cycleWindow";

const getRows = lazy(() => getCurveRows(getBreakevenSeries()));

export function Breakevens() {
  return (
    <CycleTable
      badge="BREAKEVENS"
      ariaLabel="US Treasury breakeven inflation"
      rowHeaderLabel="TENOR"
      rows={getRows()}
      decimals={2}
    />
  );
}
