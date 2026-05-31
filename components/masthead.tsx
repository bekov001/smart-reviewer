"use client";

import { useEffect, useState } from "react";

/**
 * Broadsheet nameplate. A serif title framed by editorial rules, with a dateline
 * row carrying the date and the running count of analyses on file. The date is
 * rendered after mount to avoid a server/client clock mismatch.
 */
export function Masthead({ analyzedCount }: { analyzedCount: number }) {
  const [today, setToday] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setToday(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <header className="border-b-2 border-ink">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Dateline */}
        <div className="flex items-center justify-between border-b border-hairline py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
          <span className="tabular-nums">{today || " "}</span>
          <span className="flex items-center gap-2 tabular-nums">
            <span
              aria-hidden
              className="text-ink"
              style={{ animation: "blink 1.6s var(--ease-out-quint) infinite" }}
            >
              ●
            </span>
            <span>
              <span className="text-ink">{analyzedCount}</span> on file
            </span>
          </span>
        </div>

        {/* Nameplate */}
        <div className="py-6 text-center sm:py-7">
          <h1 className="font-serif text-4xl font-semibold leading-none tracking-[-0.01em] text-ink sm:text-5xl">
            Smart Reviewer
          </h1>
          <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.32em] text-faint">
            AI Summary &amp; Sentiment Desk
          </p>
        </div>
      </div>
    </header>
  );
}
