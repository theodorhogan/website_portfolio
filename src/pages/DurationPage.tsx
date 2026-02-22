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
        <div className="duration-page__topLeft">
          <div className="duration-page__topRow">
            <div className="duration-page__ratesSlot">
              <RatesAndYield />
            </div>
            <div className="duration-page__rightStack">
              <div className="duration-page__slopesSlot">
                <YieldSlopes />
              </div>
              <div className="duration-page__creditSlot">
                <CreditSpreads />
              </div>
            </div>
          </div>
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
        </div>
      </div>
    </section>
  );
}
