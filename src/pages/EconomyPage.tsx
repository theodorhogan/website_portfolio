import { DebtToGdp } from "../components/DebtToGdp";
import { GdpBreakdown } from "../components/GdpBreakdown";
import { GdpNow } from "../components/GdpNow";
import { MonthlyData } from "../components/MonthlyData";
import { QuarterlyData } from "../components/QuarterlyData";
import "./EconomyPage.css";

export function EconomyPage() {
  return (
    <section className="economy-page">
      <div className="economy-page__layout">
        <div className="economy-page__column economy-page__column--main">
          <GdpNow />
          <MonthlyData />
          <QuarterlyData />
        </div>
        <aside className="economy-page__column economy-page__column--side">
          <GdpBreakdown />
          <DebtToGdp />
        </aside>
      </div>
    </section>
  );
}
