export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-10 rounded bg-canvas" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-10 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-8 text-center" role="alert">
      <p className="text-base font-semibold text-risk">That didn&apos;t load</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry ? (
        <button type="button" className="btn-secondary mt-4" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
