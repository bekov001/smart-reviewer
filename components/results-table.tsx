import type { AnalysisRecord, Sentiment } from "@/lib/types";
import { EmptyState } from "./state";
import { ExternalIcon } from "./icons";

const sentimentColor: Record<Sentiment, string> = {
  positive: "var(--color-positive)",
  neutral: "var(--color-neutral)",
  negative: "var(--color-negative)",
};

const sentimentWash: Record<Sentiment, string> = {
  positive: "var(--positive-wash)",
  neutral: "var(--neutral-wash)",
  negative: "var(--negative-wash)",
};

/** Labeled pill — sentiment is never conveyed by color alone. */
function SentimentPill({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-xs font-medium capitalize"
      style={{ background: sentimentWash[sentiment], color: sentimentColor[sentiment] }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: sentimentColor[sentiment] }}
      />
      {sentiment}
    </span>
  );
}

/** Pill + numeric score, for the live analysis bulletin and one-off readouts. */
export function SentimentBadge({
  sentiment,
  score,
}: {
  sentiment: Sentiment;
  score: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-xs font-medium capitalize"
      style={{ background: sentimentWash[sentiment], color: sentimentColor[sentiment] }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: sentimentColor[sentiment] }}
      />
      {sentiment}
      <span className="tabular-nums opacity-80">
        {score > 0 ? "+" : ""}
        {score.toFixed(2)}
      </span>
    </span>
  );
}

/** A −1 … +1 readout: center-anchored track, marker placed at the score. */
function SentimentMeter({ sentiment, score }: { sentiment: Sentiment; score: number }) {
  const clamped = Math.max(-1, Math.min(1, score));
  const markerPct = ((clamped + 1) / 2) * 100;
  const color = sentimentColor[sentiment];
  const fillLeft = Math.min(50, markerPct);
  const fillWidth = Math.abs(markerPct - 50);

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative h-1 w-24 shrink-0 rounded-full bg-sunken"
        role="meter"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={clamped}
        aria-label={`Sentiment score ${clamped.toFixed(2)} of 1`}
      >
        <span className="absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-rule" />
        <span
          className="absolute top-0 h-full rounded-full"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%`, background: color }}
        />
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper"
          style={{ left: `${markerPct}%`, background: color }}
        />
      </div>
      <span
        className="w-11 shrink-0 text-right font-mono text-xs tabular-nums"
        style={{ color }}
      >
        {clamped > 0 ? "+" : ""}
        {clamped.toFixed(2)}
      </span>
    </div>
  );
}

function ArticleLink({ record }: { record: AnalysisRecord }) {
  return (
    <a
      href={record.url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-start gap-1.5 font-serif text-base font-medium leading-snug text-ink decoration-rule underline-offset-2 transition-colors hover:underline"
    >
      <span className="line-clamp-2">{record.title}</span>
      <ExternalIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-faint" />
    </a>
  );
}

export function ResultsTable({ records }: { records: AnalysisRecord[] }) {
  if (records.length === 0) {
    return (
      <EmptyState title="Ledger empty">
        No analyses on file yet. Search the wire above and analyze an article;
        every result is stored and listed here.
      </EmptyState>
    );
  }

  return (
    <>
      {/* Desktop / tablet: ruled broadsheet table. */}
      <div className="hidden border-y-2 border-ink md:block">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-3 font-medium">Article</th>
              <th className="px-2 py-3 font-medium">Source</th>
              <th className="px-2 py-3 font-medium">Sentiment</th>
              <th className="px-2 py-3 font-medium">Summary</th>
              <th className="whitespace-nowrap px-2 py-3 font-medium">Analyzed</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr
                key={r.url}
                className="border-b border-hairline align-top transition-colors last:border-0 hover:bg-surface"
                style={{
                  animation: "row-in 0.4s var(--ease-out-quint) both",
                  animationDelay: `${Math.min(i, 8) * 40}ms`,
                }}
              >
                <td className="max-w-xs px-2 py-4">
                  <ArticleLink record={r} />
                </td>
                <td className="whitespace-nowrap px-2 py-4 font-mono text-xs uppercase tracking-wider text-muted">
                  {r.source}
                </td>
                <td className="px-2 py-4">
                  <div className="flex flex-col gap-1.5">
                    <SentimentPill sentiment={r.sentiment} />
                    <SentimentMeter sentiment={r.sentiment} score={r.score} />
                  </div>
                </td>
                <td className="max-w-md px-2 py-4 leading-relaxed text-muted">
                  {r.summary}
                </td>
                <td className="whitespace-nowrap px-2 py-4 font-mono text-xs tabular-nums text-faint">
                  {new Date(r.analyzedAt).toLocaleString("en-US", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked ruled records. */}
      <ul className="flex flex-col border-t-2 border-ink md:hidden">
        {records.map((r, i) => (
          <li
            key={r.url}
            className="flex flex-col gap-3 border-b border-hairline py-4 last:border-0"
            style={{
              animation: "row-in 0.4s var(--ease-out-quint) both",
              animationDelay: `${Math.min(i, 8) * 40}ms`,
            }}
          >
            <div className="flex items-center justify-between gap-3 font-mono text-xs text-faint">
              <span className="truncate uppercase tracking-wider text-muted">
                {r.source}
              </span>
              <time className="shrink-0 tabular-nums">
                {new Date(r.analyzedAt).toLocaleDateString()}
              </time>
            </div>
            <ArticleLink record={r} />
            <div className="flex flex-col gap-2">
              <SentimentPill sentiment={r.sentiment} />
              <SentimentMeter sentiment={r.sentiment} score={r.score} />
            </div>
            <p className="text-sm leading-relaxed text-muted">{r.summary}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
