import { BlogWindow } from "../components/BlogWindow";
import { EconomicData } from "../components/EconomicData";
import "./MainPage.css";

export function MainPage() {
  return (
    <section className="main-page">
      <div className="main-page__stack">
        <div className="main-page__panel">
          <div className="main-page__economicSlot">
            <EconomicData />
          </div>
          <div className="main-page__blogSlot">
            <BlogWindow />
          </div>
          <div className="main-page__spacer" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
