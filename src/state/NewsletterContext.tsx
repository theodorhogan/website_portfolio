import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { NEWSLETTERS } from "../data/newsletters";
import { NewsletterContext, type NewsletterContextValue } from "./newsletterStoreContext";

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const defaultId = NEWSLETTERS[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultId);

  const value = useMemo<NewsletterContextValue>(() => {
    const selected = NEWSLETTERS.find((entry) => entry.id === selectedId) ?? NEWSLETTERS[0] ?? null;
    return { newsletters: NEWSLETTERS, selectedId, setSelectedId, selected };
  }, [selectedId]);

  return <NewsletterContext.Provider value={value}>{children}</NewsletterContext.Provider>;
}
