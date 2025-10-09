import { PdfReader } from "../components/PdfReader";
import "./MainPage.css";

export function MainPage() {
  return (
    <section className="main-page">
      <div className="main-page__card">
        <h1 className="main-page__title">Main Page</h1>
        <p className="main-page__subtitle">
          A central hub for showcasing featured work and quick navigation
          through the portfolio.
        </p>
      </div>
      {/*<PdfReader
        pdfUrl="/ExercisesLecture3_solutions.pdf"
        title="Exercises Lecture 3 — Solutions"
      />*/}
    </section>
  );
}
