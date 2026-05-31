"use client";

import { useState } from "react";
import type { NewsArticle } from "@/lib/types";
import { AnalyzeIcon, CheckIcon, ExternalIcon } from "./icons";

export function ArticleCard({
  article,
  onAnalyze,
  analyzing,
  analyzed,
}: {
  article: NewsArticle;
  onAnalyze: (a: NewsArticle) => void;
  analyzing: boolean;
  analyzed: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const date = new Date(article.publishedAt);
  const stamp = Number.isNaN(date.getTime())
    ? ""
    : date
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase();

  return (
    <article className="group flex flex-col border-t-2 border-ink pt-3">
      <div className="flex items-center justify-between gap-3 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
        <span className="truncate font-medium">{article.source}</span>
        {stamp && <time className="shrink-0 tabular-nums">{stamp}</time>}
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-start gap-1.5 font-serif text-lg font-medium leading-tight text-balance text-ink decoration-rule decoration-1 underline-offset-2 transition-colors hover:underline"
      >
        <span>{article.title}</span>
        <ExternalIcon className="mt-1.5 h-3.5 w-3.5 shrink-0 text-faint" />
      </a>

      {article.image && !imgFailed ? (
        <div className="mt-3 overflow-hidden border border-hairline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            loading="lazy"
            decoding="async"
            // News image CDNs commonly 403 cross-origin hotlinks; dropping the
            // referrer lets most of them serve. Any that still fail are hidden.
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      {article.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {article.description}
        </p>
      )}

      <button
        onClick={() => onAnalyze(article)}
        disabled={analyzing}
        aria-busy={analyzing}
        className={`mt-3.5 inline-flex w-fit items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors duration-200 disabled:cursor-progress ${
          analyzed
            ? "border-hairline text-muted hover:border-rule hover:text-ink"
            : "border-ink text-ink hover:bg-ink hover:text-paper"
        }`}
      >
        {analyzing ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-rule border-t-ink" />
            Analyzing
          </>
        ) : analyzed ? (
          <>
            <CheckIcon className="h-3.5 w-3.5 text-positive" />
            Re-analyze
          </>
        ) : (
          <>
            <AnalyzeIcon className="h-3.5 w-3.5" />
            Analyze
          </>
        )}
      </button>
    </article>
  );
}
