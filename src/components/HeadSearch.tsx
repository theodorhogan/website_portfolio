import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { NewsletterEntry } from "../data/newsletters";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { isEditableTarget } from "../utils/dom";

type SearchResult = {
  entry: NewsletterEntry;
  /** Text around the first match, split so the match itself can be highlighted. */
  snippet: { before: string; match: string; after: string } | null;
};

const MAX_RESULTS = 8;
const MIN_QUERY_LENGTH = 2;
const SNIPPET_LEAD = 28;
const SNIPPET_LENGTH = 96;

/** Inline value markers used in bulletin text: `[[actual]]`, `[(expected)]`, `[+1.2%]`. */
const VALUE_MARKERS = /\[\[([^\]]+)\]\]|\[\(([^)]+)\)\]|\[([+-]?\d+(?:\.\d+)?%)\]/g;

function buildSnippet(content: string, lowerContent: string, term: string): SearchResult["snippet"] {
  const index = lowerContent.indexOf(term);
  if (index < 0) return null;

  const start = Math.max(0, index - SNIPPET_LEAD);
  const end = Math.min(content.length, start + SNIPPET_LENGTH);
  const flatten = (text: string) => text.replace(/\s+/g, " ");

  return {
    before: (start > 0 ? "..." : "") + flatten(content.slice(start, index)),
    match: content.slice(index, index + term.length),
    after: flatten(content.slice(index + term.length, end)) + (end < content.length ? "..." : ""),
  };
}

/** Header search across bulletin titles and text. Press `/` anywhere to focus it. */
export function HeadSearch() {
  const { newsletters, setSelectedId } = useNewsletterContext();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const index = useMemo(
    () =>
      newsletters.map((entry) => {
        // Search and quote the text as it reads on screen, without the marker brackets.
        const text = entry.content.replace(VALUE_MARKERS, "$1$2$3");
        return { entry, title: entry.title.toLowerCase(), text, lowerText: text.toLowerCase() };
      }),
    [newsletters],
  );

  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const isSearching = query.trim().length >= MIN_QUERY_LENGTH;

  const results = useMemo<SearchResult[]>(() => {
    if (!isSearching) return [];

    // Bulletins whose title matches every term rank ahead of body-only matches; each group stays newest first.
    const titleMatches: SearchResult[] = [];
    const bodyMatches: SearchResult[] = [];

    for (const item of index) {
      if (!terms.every((term) => item.title.includes(term) || item.lowerText.includes(term))) continue;

      const bodyTerm = terms.find((term) => item.lowerText.includes(term));
      const result = {
        entry: item.entry,
        snippet: bodyTerm ? buildSnippet(item.text, item.lowerText, bodyTerm) : null,
      };
      (terms.every((term) => item.title.includes(term)) ? titleMatches : bodyMatches).push(result);
    }

    return [...titleMatches, ...bodyMatches].slice(0, MAX_RESULTS);
  }, [index, terms, isSearching]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const choose = (result: SearchResult) => {
    setSelectedId(result.entry.id);
    navigate("/");
    close();
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  };

  const showPanel = isOpen && isSearching;
  const activeOptionId = showPanel && results[activeIndex] ? `${listId}-${activeIndex}` : undefined;

  return (
    <div className="head-search">
      <span className="head-searchPrompt" aria-hidden="true">
        &gt;
      </span>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        placeholder="Search bulletins"
        className="head-searchInput"
        aria-label="Search bulletins"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={activeOptionId}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={onInputKeyDown}
      />
      {query === "" ? (
        <kbd className="head-searchKey" aria-hidden="true">
          /
        </kbd>
      ) : null}
      {showPanel ? (
        // Keep focus in the input while the list is clicked, so the blur handler does not close it first.
        <ul id={listId} role="listbox" className="head-searchResults" onMouseDown={(event) => event.preventDefault()}>
          {results.length === 0 ? (
            <li className="head-searchEmpty">No bulletins match &ldquo;{query.trim()}&rdquo;</li>
          ) : (
            results.map((result, resultIndex) => (
              <li
                key={result.entry.id}
                id={`${listId}-${resultIndex}`}
                role="option"
                aria-selected={resultIndex === activeIndex}
                className={`head-searchResult${resultIndex === activeIndex ? " is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(resultIndex)}
                onClick={() => choose(result)}
              >
                <span className="head-searchResultHead">
                  <span className="head-searchResultTitle">{result.entry.title}</span>
                  <span className="head-searchResultDate">{result.entry.dateLabel}</span>
                </span>
                {result.snippet ? (
                  <span className="head-searchResultSnippet">
                    {result.snippet.before}
                    <mark>{result.snippet.match}</mark>
                    {result.snippet.after}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
