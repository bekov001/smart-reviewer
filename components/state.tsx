import { AlertIcon, RefreshIcon } from "./icons";

export function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 border border-negative bg-[var(--negative-wash)] px-4 py-3 text-sm"
    >
      <span className="flex items-center gap-2.5 text-ink">
        <AlertIcon className="h-[18px] w-[18px] shrink-0 text-negative" />
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-ink px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-y border-hairline px-6 py-12 text-center">
      {title && (
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint">
          {title}
        </p>
      )}
      <p className="mx-auto mt-2 max-w-md font-serif text-lg leading-relaxed text-muted">
        {children}
      </p>
    </div>
  );
}

/** Feed loading — ghost index items matching the article rhythm. */
export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-t-2 border-ink pt-3">
      <div className="flex justify-between">
        <div className="skeleton h-3 w-24 rounded-sm" />
        <div className="skeleton h-3 w-16 rounded-sm" />
      </div>
      <div className="skeleton h-5 w-[92%] rounded-sm" />
      <div className="skeleton h-5 w-[60%] rounded-sm" />
      <div className="skeleton aspect-[16/9] w-full" />
      <div className="skeleton h-7 w-28 rounded-sm" />
    </div>
  );
}

export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Ledger loading — ghost ruled rows. */
export function LedgerSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="border-y-2 border-ink">
      <div className="h-10 border-b-2 border-ink bg-surface" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-hairline px-1 py-4 last:border-0"
        >
          <div className="skeleton h-4 w-1/3 rounded-sm" />
          <div className="skeleton h-4 w-20 rounded-sm" />
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-4 flex-1 rounded-sm" />
        </div>
      ))}
    </div>
  );
}
