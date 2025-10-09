import { BlogWindow } from "../components/BlogWindow";
import { SPXChart } from "../components/SPXChart";
import "./MainPage.css";

export function MainPage() {
  return (
    <section className="main-page">
      <div className="main-page__stack">
        <BlogWindow />
        <SPXChart />
      </div>
    </section>
  );
}
