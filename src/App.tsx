import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { Head } from "./components/Head";
import { NavBar } from "./components/NavBar";
import { BetaPage } from "./pages/BetaPage";
import { DurationPage } from "./pages/DurationPage";
import { MainPage } from "./pages/MainPage";
import { ModelsPage } from "./pages/ModelsPage";
import { NewsletterProvider } from "./state/NewsletterContext";

function AppContent() {
  const location = useLocation();
  const isBetaRoute = location.pathname === "/beta";

  return (
    <div className={`app-content${isBetaRoute ? " app-content--wide" : ""}`}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/duration" element={<DurationPage />} />
        <Route path="/beta" element={<BetaPage />} />
        <Route path="/models" element={<ModelsPage />} />
      </Routes>
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
