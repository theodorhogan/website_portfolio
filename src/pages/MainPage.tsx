import { BlogWindow } from "../components/BlogWindow";
import { EconomicData } from "../components/EconomicData";
import "./MainPage.css";

export function MainPage() {
  return (
    <section className="main-page">
      <div className="main-page__layout">
        <div className="main-page__workspace">
          <div className="main-page__blogSlot">
            <BlogWindow />
          </div>
        </div>
        <aside className="main-page__context">
          <div className="main-page__economicSlot">
            <EconomicData />
          </div>
        </aside>
      </div>
    </section>
  );
}
