import { BlogWindow } from "../components/BlogWindow";
import "./MainPage.css";

export function MainPage() {
  return (
    <section className="main-page">
      <div className="main-page__stack">
        <div className="main-page__panel">
          <BlogWindow />
        </div>
      </div>
    </section>
  );
}
