import type { ComponentType } from "react";

export type ModelModule = {
  id: string;
  fileName: string;
  label: string;
  Component: ComponentType;
};

function formatModelLabel(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function parseModelPath(path: string, Component: ComponentType): ModelModule | null {
  const fileName = path.split("/").at(-1) ?? "";
  if (!fileName) return null;

  const id = fileName.replace(/\.[^.]+$/, "");
  return {
    id,
    fileName,
    label: formatModelLabel(fileName),
    Component,
  };
}

const jsxModules = import.meta.glob("../content/models/*.jsx", {
  eager: true,
  import: "default",
}) as Record<string, ComponentType>;

const tsxModules = import.meta.glob("../content/models/*.tsx", {
  eager: true,
  import: "default",
}) as Record<string, ComponentType>;

export const MODELS: ModelModule[] = [...Object.entries(jsxModules), ...Object.entries(tsxModules)]
  .map(([path, Component]) => parseModelPath(path, Component))
  .filter((entry): entry is ModelModule => entry !== null)
  .sort((a, b) => a.label.localeCompare(b.label));
