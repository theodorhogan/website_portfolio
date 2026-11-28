import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Head } from "./components/Head";
import { NavBar } from "./components/NavBar";
import { NewsletterProvider } from "./state/NewsletterContext";
import { isEditableTarget } from "./utils/dom";

// One chunk per page, so a page only downloads the datasets it renders.
const MainPage = lazy(() => import("./pages/MainPage").then((module) => ({ default: module.MainPage })));
const DurationPage = lazy(() =>
  import("./pages/DurationPage").then((module) => ({ default: module.DurationPage })),
);
const RealPage = lazy(() => import("./pages/RealPage").then((module) => ({ default: module.RealPage })));
const BetaPage = lazy(() => import("./pages/BetaPage").then((module) => ({ default: module.BetaPage })));
const EarningsPage = lazy(() =>
  import("./pages/EarningsPage").then((module) => ({ default: module.EarningsPage })),
);
const EconomyPage = lazy(() =>
  import("./pages/EconomyPage").then((module) => ({ default: module.EconomyPage })),
);

/** `?grid=1` starts with the layout grid overlay on; `g` toggles it. */
function getInitialGridEnabled() {
  return new URLSearchParams(window.location.search).get("grid") === "1";
}

function AppContent() {
  return (
    <div className="app-content">
      <Suspense fallback={<div className="app-content__loading">Loading...</div>}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/duration" element={<DurationPage />} />
          <Route path="/real" element={<RealPage />} />
          <Route path="/beta" element={<BetaPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/economy" element={<EconomyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
