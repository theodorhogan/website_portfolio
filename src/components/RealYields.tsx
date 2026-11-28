import { lazy } from "../data/csvStore";
import { getRealYieldSeries } from "../data/ratesData";
import { CycleTable } from "./CycleTable";
import { getCurveRows } from "./cycleWindow";

const getRows = lazy(() => getCurveRows(getRealYieldSeries()));

export function RealYields() {
  return (
    <CycleTable
      badge="REAL YIELDS"
      ariaLabel="US Treasury real yields"
      rowHeaderLabel="TENOR"
      rows={getRows()}
      decimals={2}
    />
  );
}
