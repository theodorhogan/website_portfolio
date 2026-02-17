import { FullWatchlist } from "../components/FullWatchlist";
import { IndustryOverview } from "../components/IndustryOverview";
import { MajorIndexes } from "../components/MajorIndexes";
import { SPXIndexChart } from "../components/SPXIndexChart";
import { STOXXIndexChart } from "../components/STOXXIndexChart";
import "./BetaPage.css";

export function BetaPage() {
  return (
    <section className="beta-page">
      <div className="beta-page__layout">
        <div className="beta-page__column beta-page__column--left">
          <div className="beta-page__slot beta-page__slot--spx">
            <SPXIndexChart />
          </div>
          <div className="beta-page__slot beta-page__slot--stoxx">
            <STOXXIndexChart />
          </div>
        </div>
        <div className="beta-page__column beta-page__column--middle">
          <div className="beta-page__slot beta-page__slot--major">
            <MajorIndexes />
          </div>
          <div className="beta-page__slot beta-page__slot--industry">
            <IndustryOverview />
          </div>
        </div>
        <div className="beta-page__column beta-page__column--right">
          <div className="beta-page__slot beta-page__slot--watchlist">
            <FullWatchlist />
          </div>
        </div>
      </div>
    </section>
  );
}
