import { Suspense, useState } from "react";
import { PanelShell } from "../components/PanelShell";
import { MODELS } from "../data/models";
import "./ModelsPage.css";

export function ModelsPage() {
  const [selectedId, setSelectedId] = useState(MODELS[0]?.id ?? "");
  const selectedModel = MODELS.find((entry) => entry.id === selectedId) ?? MODELS[0] ?? null;

  return (
    <section className="models-page">
      <PanelShell
        className="models-page__shell h-full"
        variant="standard"
        bodyMode="stretch"
        badge="MODELS"
        title={selectedModel?.label ?? "Model Viewer"}
        meta={`${MODELS.length} interactive ${MODELS.length === 1 ? "model" : "models"}`}
        actions={
          <label className="models-page__selectGroup">
            <span className="sr-only">Select model</span>
            <select
              className="models-page__select"
              value={selectedModel?.id ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {MODELS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        }
        bodyClassName="models-page__viewer"
      >
        {selectedModel ? (
          <div className="models-page__viewerInner">
            <Suspense fallback={<div className="models-page__empty">Loading {selectedModel.label}...</div>}>
              <selectedModel.Component key={selectedModel.id} />
            </Suspense>
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
