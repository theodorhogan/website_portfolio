import { useEffect, useState } from "react";
import { PanelShell } from "../components/PanelShell";
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
      <PanelShell
        className="models-page__shell h-full"
        variant="standard"
        bodyMode="stretch"
        badge="MODELS"
        title="Model Viewer"
        meta="Drop `.jsx` or `.tsx` files into `src/content/models/`."
        actions={
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
        }
        bodyClassName="models-page__viewer"
      >
          {SelectedComponent ? (
            <div className="models-page__viewerInner">
              <SelectedComponent />
            </div>
          ) : (
            <div className="models-page__empty">
              No model files found. Add components to `src/content/models/` and they will appear here.
            </div>
          )}
      </PanelShell>
    </section>
  );
}
