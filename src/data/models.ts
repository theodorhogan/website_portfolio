import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type ModelModule = {
  id: string;
  fileName: string;
  label: string;
  Component: LazyExoticComponent<ComponentType>;
};

function formatModelLabel(id: string) {
  return id
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

/**
 * Every `.jsx` / `.tsx` file in `src/content/models/` becomes a selectable
 * model. Each one is its own chunk, fetched the first time it is opened.
 */
const modelLoaders = import.meta.glob<{ default: ComponentType }>("../content/models/*.{jsx,tsx}");

export const MODELS: ModelModule[] = Object.entries(modelLoaders)
  .map(([path, load]) => {
    const fileName = path.split("/").at(-1) ?? "";
    const id = fileName.replace(/\.[^.]+$/, "");
    return { id, fileName, label: formatModelLabel(id), Component: lazy(load) };
  })
  .sort((a, b) => a.label.localeCompare(b.label));
