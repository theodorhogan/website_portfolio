import { CreditSpreads } from "../components/CreditSpreads";
import { FedFutures } from "../components/FedFutures";
import { QuartlyCuts } from "../components/QuartlyCuts";
import { RatesAndYield } from "../components/RatesAndYield";
import { YieldCurveGraph } from "../components/YieldCurveGraph";
import { YieldSlopes } from "../components/YieldSlopes";
import "./DurationPage.css";

export function DurationPage() {
  return (
    <section className="duration-page">
      <div className="duration-page__layout">

        {/* Col 1, Row 1 — rates table keeps full left-column width */}
        <div className="duration-page__ratesSlot">
          <RatesAndYield />
        </div>

        {/* Col 1, Row 2 — three panels side by side: curves + cuts */}
        <div className="duration-page__chartsRow">
          <div className="duration-page__curveSlot">
            <YieldCurveGraph />
          </div>
          <div className="duration-page__curveSlot">
            <FedFutures />
          </div>
          <div className="duration-page__cutsSlot">
            <QuartlyCuts />
          </div>
        </div>

        {/* Col 2, spans rows 1–2 — right stack: slopes + OAS */}
        <div className="duration-page__rightStack">
          <div className="duration-page__slopesSlot">
            <YieldSlopes />
          </div>
          <div className="duration-page__creditSlot">
            <CreditSpreads />
          </div>
        </div>

      </div>
    </section>
  );
}
