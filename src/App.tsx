import { Suspense, lazy } from "react";
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

function AppContent() {
  const location = useLocation();
  const isWideRoute = location.pathname === "/beta" || location.pathname === "/duration";

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
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <NewsletterProvider>
        <div className="app-shell">
          <Head />
          <main className="app-main">
            <AppContent />
          </main>
          <NavBar />
        </div>
      </NewsletterProvider>
    </BrowserRouter>
  );
}

export default App;
