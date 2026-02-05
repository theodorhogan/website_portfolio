import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { Head } from "./components/Head";
import { NavBar } from "./components/NavBar";
import { BetaPage } from "./pages/BetaPage";
import { DurationPage } from "./pages/DurationPage";
import { MainPage } from "./pages/MainPage";
import { ModelsPage } from "./pages/ModelsPage";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Head />
        <main className="app-main">
          <div className="app-content">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/duration" element={<DurationPage />} />
              <Route path="/beta" element={<BetaPage />} />
              <Route path="/models" element={<ModelsPage />} />
            </Routes>
          </div>
        </main>
        <NavBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
