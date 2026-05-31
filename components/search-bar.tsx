"use client";

import { useState } from "react";
import { SearchIcon } from "./icons";

// Quick-search presets — make the tool feel useful, not a blank box.
const TOPICS: { label: string; query: string }[] = [
  { label: "AI", query: "artificial intelligence" },
  { label: "Crypto", query: "cryptocurrency" },
  { label: "Markets", query: "stock market" },
  { label: "Politics", query: "politics" },
  { label: "Sports", query: "sports" },
  { label: "Tech", query: "technology" },
];

export function SearchBar({
  onSearch,
  loading,
}: {
  onSearch: (q: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  const runSearch = (q: string) => {
    setValue(q);
    onSearch(q);
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSearch(value.trim());
        }}
        className="flex w-full items-stretch gap-3"
        role="search"
      >
        <label htmlFor="news-search" className="sr-only">
          Search recent news
        </label>
        <div className="group flex flex-1 items-center gap-3 rounded-sm bg-surface px-3.5 transition-colors duration-150 focus-within:bg-sunken">
          <SearchIcon className="h-[18px] w-[18px] shrink-0 text-faint transition-colors group-focus-within:text-ink" />
          <input
            id="news-search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search the wire, e.g. artificial intelligence"
            className="min-w-0 flex-1 bg-transparent py-3 font-serif text-lg text-ink outline-none placeholder:font-sans placeholder:text-base placeholder:text-faint"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink px-5 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors duration-200 hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-rule"
        >
          {loading ? "Searching" : "Search"}
        </button>
      </form>

      <nav
        aria-label="Trending topics"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="mr-1 font-mono text-xs uppercase tracking-[0.14em] text-faint">
          Trending
        </span>
        {TOPICS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => runSearch(t.query)}
            disabled={loading}
            className="rounded-full border border-rule px-3 py-1 font-mono text-xs uppercase tracking-[0.08em] text-muted transition-colors duration-150 hover:border-ink hover:text-ink focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
