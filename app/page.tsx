"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Masthead } from "@/components/masthead";
import { SearchBar } from "@/components/search-bar";
import { ArticleCard } from "@/components/article-card";
import { ResultsTable, SentimentBadge } from "@/components/results-table";
import {
  ErrorBox,
  EmptyState,
  FeedSkeleton,
  LedgerSkeleton,
} from "@/components/state";
import { RefreshIcon } from "@/components/icons";
import { analysisSchema } from "@/lib/schema";
import type { AnalysisRecord, NewsArticle, Sentiment } from "@/lib/types";

type SentimentFilter = "all" | Sentiment;
type SortBy = "newest" | "score-desc" | "score-asc";

function SectionHead({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <h2 className="flex items-baseline gap-3 font-serif text-2xl font-semibold tracking-[-0.01em] text-ink">
      {children}
      {typeof count === "number" && (
        <span className="font-mono text-sm font-normal tabular-nums text-faint">
          {count}
        </span>
      )}
    </h2>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const loadAnalyses = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const res = await fetch("/api/analyses");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analyses");
      setRecords(data.records);
    } catch {
      // Non-fatal: the ledger simply shows its empty state.
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  // Load previously stored analyses on mount (proves MongoDB persistence).
  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  // Streaming analysis. The endpoint streams partial objects so the summary
  // appears live; on finish we pull the saved record into the ledger.
  const { submit, object, isLoading, error } = useObject({
    api: "/api/analyze",
    schema: analysisSchema,
    onFinish: ({ error }) => {
      if (!error) loadAnalyses();
    },
  });

  const search = useCallback(async (q: string) => {
    setQuery(q);
    setSearchLoading(true);
    setSearchError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.articles);
    } catch (e) {
      setResults([]);
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const analyze = useCallback(
    (article: NewsArticle) => {
      setActiveArticle(article);
      submit(article);
    },
    [submit],
  );

  const analyzedUrls = useMemo(
    () => new Set(records.map((r) => r.url)),
    [records],
  );

  const visibleRecords = useMemo(() => {
    const filtered =
      sentimentFilter === "all"
        ? records
        : records.filter((r) => r.sentiment === sentimentFilter);
    const sorted = [...filtered];
    if (sortBy === "score-desc") sorted.sort((a, b) => b.score - a.score);
    else if (sortBy === "score-asc") sorted.sort((a, b) => a.score - b.score);
    else sorted.sort((a, b) => +new Date(b.analyzedAt) - +new Date(a.analyzedAt));
    return sorted;
  }, [records, sentimentFilter, sortBy]);

  const keyPoints = (object?.keyPoints ?? []).filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );

  return (
    <>
      <Masthead analyzedCount={records.length} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <section className="mb-14" aria-labelledby="results-heading">
          <SearchBar onSearch={search} loading={searchLoading} />

          <div className="mt-8">
            {searchLoading && <FeedSkeleton />}

            {!searchLoading && searchError && (
              <ErrorBox
                message={searchError}
                onRetry={() => query && search(query)}
              />
            )}

            {!searchLoading && !searchError && searched && results.length === 0 && (
              <EmptyState title="No matches">
                Nothing found for “{query}”. Try a broader term or different
                keywords.
              </EmptyState>
            )}

            {!searchLoading && results.length > 0 && (
              <>
                <div className="mb-6" id="results-heading">
                  <SectionHead count={results.length}>
                    Results for “{query}”
                  </SectionHead>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((a) => (
                    <ArticleCard
                      key={a.url}
                      article={a}
                      onAnalyze={analyze}
                      analyzing={isLoading && activeArticle?.url === a.url}
                      analyzed={analyzedUrls.has(a.url)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Live analysis bulletin — summary streams in as it is generated. */}
        {activeArticle && (
          <section className="mb-14 border-y-2 border-ink py-5" aria-live="polite">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint">
                {isLoading ? "Analyzing…" : error ? "Analysis failed" : "Latest analysis"}
              </span>
              {object?.sentiment && typeof object.score === "number" && (
                <SentimentBadge sentiment={object.sentiment} score={object.score} />
              )}
            </div>

            <a
              href={activeArticle.url}
              target="_blank"
              rel="noreferrer"
              className="font-serif text-xl font-medium leading-tight text-balance text-ink decoration-rule underline-offset-2 hover:underline"
            >
              {activeArticle.title}
            </a>

            {error ? (
              <div className="mt-4">
                <ErrorBox
                  message="AI analysis failed. Please try again."
                  onRetry={() => activeArticle && analyze(activeArticle)}
                />
              </div>
            ) : (
              <>
                <p className="mt-3 min-h-6 max-w-2xl font-serif text-md leading-relaxed text-ink">
                  {object?.summary ?? (isLoading ? "Generating summary…" : "")}
                </p>
                {keyPoints.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {keyPoints.map((point, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ink" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        )}

        <section aria-labelledby="ledger-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div id="ledger-heading">
              <SectionHead count={!recordsLoading ? records.length : undefined}>
                The Ledger
              </SectionHead>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.1em]">
                {(["all", "positive", "neutral", "negative"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSentimentFilter(s)}
                    aria-pressed={sentimentFilter === s}
                    className={`pb-0.5 capitalize transition-colors ${
                      sentimentFilter === s
                        ? "border-b-2 border-ink text-ink"
                        : "border-b-2 border-transparent text-faint hover:text-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <label className="sr-only" htmlFor="sort">
                Sort ledger
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="border-b-2 border-hairline bg-transparent pb-0.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted outline-none transition-colors hover:text-ink focus:border-ink"
              >
                <option value="newest">Newest</option>
                <option value="score-desc">Score: high → low</option>
                <option value="score-asc">Score: low → high</option>
              </select>

              <button
                onClick={loadAnalyses}
                disabled={recordsLoading}
                className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink disabled:opacity-50"
              >
                <RefreshIcon
                  className={`h-3.5 w-3.5 ${recordsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {recordsLoading ? (
            <LedgerSkeleton />
          ) : sentimentFilter !== "all" && visibleRecords.length === 0 ? (
            <EmptyState title="No matches">
              No {sentimentFilter} analyses on file. Clear the filter to see all
              records.
            </EmptyState>
          ) : (
            <ResultsTable records={visibleRecords} />
          )}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <p className="border-t border-hairline pt-4 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint">
          GNews → OpenAI · one structured pass → MongoDB
        </p>
      </footer>
    </>
  );
}
