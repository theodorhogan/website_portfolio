import { BlogWindow } from "../components/BlogWindow";
import { FullWatchlist } from "../components/FullWatchlist";
import { IndustryOverview } from "../components/IndustryOverview";
import { MajorIndexes } from "../components/MajorIndexes";
import "./MainPage.css";

export function MainPage() {
  return (
    <section className="main-page">
      <div className="main-page__stack">
        <div className="main-page__panel main-page__panel--left">
          <BlogWindow />
          <IndustryOverview />
        </div>
        <div className="main-page__panel main-page__panel--right">
          <MajorIndexes />
          <FullWatchlist />
        </div>
      </div>
    </section>
  );
}
