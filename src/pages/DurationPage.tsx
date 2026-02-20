import { RatesAndYield } from "../components/RatesAndYield";
import { YieldCurveGraph } from "../components/YieldCurveGraph";
import "./DurationPage.css";

export function DurationPage() {
  return (
    <section className="duration-page">
      <div className="duration-page__layout">
        <div className="duration-page__topLeft">
          <div className="duration-page__ratesSlot">
            <RatesAndYield />
          </div>
          <div className="duration-page__curveSlot">
            <YieldCurveGraph />
          </div>
        </div>
      </div>
    </section>
  );
}
