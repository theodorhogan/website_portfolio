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
        <div className="duration-page__ratesSlot">
          <RatesAndYield />
        </div>

        <div className="duration-page__curveSlot">
          <YieldCurveGraph />
        </div>

        <div className="duration-page__futuresSlot">
          <FedFutures />
        </div>

        <aside className="duration-page__rightStack">
          <div className="duration-page__cutsSlot">
            <QuartlyCuts />
          </div>
          <div className="duration-page__slopesSlot">
            <YieldSlopes />
          </div>
          <div className="duration-page__creditSlot">
            <CreditSpreads />
          </div>
        </aside>
      </div>
    </section>
  );
}
