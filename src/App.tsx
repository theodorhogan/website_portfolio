import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { Head } from "./components/Head";
import { NavBar } from "./components/NavBar";
import { NewsletterProvider } from "./state/NewsletterContext";

const MainPage = lazy(() => import("./pages/MainPage").then((module) => ({ default: module.MainPage })));
const DurationPage = lazy(() =>
  import("./pages/DurationPage").then((module) => ({ default: module.DurationPage })),
);
const BetaPage = lazy(() => import("./pages/BetaPage").then((module) => ({ default: module.BetaPage })));
const ModelsPage = lazy(() =>
  import("./pages/ModelsPage").then((module) => ({ default: module.ModelsPage })),
);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function getInitialGridEnabled() {
  if (typeof window === "undefined") return false;

  const gridParam = new URLSearchParams(window.location.search).get("grid");
  if (gridParam === "1") return true;
  if (gridParam === "0") return false;
  return false;
}

function AppContent() {
  const location = useLocation();
  const isWideRoute =
    location.pathname === "/" || location.pathname === "/beta" || location.pathname === "/duration";

  return (
    <div className={`app-content${isWideRoute ? " app-content--wide" : ""}`}>
      <Suspense fallback={<div className="app-content__loading">Loading...</div>}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/duration" element={<DurationPage />} />
          <Route path="/beta" element={<BetaPage />} />
          <Route path="/models" element={<ModelsPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  const [isGridEnabled, setIsGridEnabled] = useState(getInitialGridEnabled);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "g") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      setIsGridEnabled((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <NewsletterProvider>
        <div className="app-shell">
          <Head />
          <main className="app-main">
            <AppContent />
          </main>
          <NavBar />
          {isGridEnabled ? <div className="layout-grid-overlay" aria-hidden="true" /> : null}
        </div>
      </NewsletterProvider>
    </BrowserRouter>
  );
}

export default App;
