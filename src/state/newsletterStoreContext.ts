import { createContext } from "react";
import type { NewsletterEntry } from "../data/newsletters";

export type NewsletterContextValue = {
  newsletters: NewsletterEntry[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  selected: NewsletterEntry | null;
};

export const NewsletterContext = createContext<NewsletterContextValue | undefined>(undefined);
