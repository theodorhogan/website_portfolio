import { useContext } from "react";
import { NewsletterContext } from "./newsletterStoreContext";

export function useNewsletterContext() {
  const ctx = useContext(NewsletterContext);
  if (!ctx) {
    throw new Error("useNewsletterContext must be used within NewsletterProvider");
  }
  return ctx;
}
