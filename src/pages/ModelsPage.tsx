import { useEffect, useState } from "react";
import { MODELS } from "../data/models";
import "./ModelsPage.css";

export function ModelsPage() {
  const [selectedId, setSelectedId] = useState(MODELS[0]?.id ?? "");

  useEffect(() => {
    if (!MODELS.some((entry) => entry.id === selectedId)) {
      setSelectedId(MODELS[0]?.id ?? "");
    }
  }, [selectedId]);

  const selectedModel = MODELS.find((entry) => entry.id === selectedId) ?? MODELS[0] ?? null;
  const SelectedComponent = selectedModel?.Component ?? null;

  return (
    <section className="models-page">
      <div className="models-page__shell">
        <div className="models-page__header">
          <div className="models-page__titleGroup">
            <span className="models-page__titleBadge">MODELS</span>
            <div>
              <h1 className="models-page__title">Model Viewer</h1>
              <p className="models-page__subtitle">Drop `.jsx` or `.tsx` files into `src/content/models/`.</p>
            </div>
          </div>
          <label className="models-page__selectGroup">
            <span className="sr-only">Select model file</span>
            <select
              className="models-page__select"
              value={selectedModel?.id ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {MODELS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.fileName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="models-page__viewer">
          {SelectedComponent ? (
            <div className="models-page__viewerInner">
              <SelectedComponent />
            </div>
          ) : (
            <div className="models-page__empty">
              No model files found. Add components to `src/content/models/` and they will appear here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
