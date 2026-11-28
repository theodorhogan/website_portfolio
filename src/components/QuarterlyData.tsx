import { getEconIndicator, type EconIndicator } from "../data/econData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { EconBarTile } from "./EconBarTile";
import { PanelShell } from "./PanelShell";

const QUARTERLY_KEYS = ["gdp_growth", "current_account"];
const QUARTERS_SHOWN = 8;

export function QuarterlyData() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;
  const indicators = QUARTERLY_KEYS.map(getEconIndicator).filter(
    (indicator): indicator is EconIndicator => indicator !== null,
  );

  return (
    <PanelShell className="quarterly-data" variant="standard" bodyMode="fit" badge="QUARTERLY DATA">
      <div className="econ-bar-grid econ-bar-grid--wide">
        {indicators.map((indicator) => (
          <EconBarTile key={indicator.key} indicator={indicator} activeTime={activeTime} count={QUARTERS_SHOWN} />
        ))}
      </div>
    </PanelShell>
  );
}
