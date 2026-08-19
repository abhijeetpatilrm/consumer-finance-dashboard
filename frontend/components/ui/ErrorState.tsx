interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-900/50 bg-red-950/20 px-6 py-16 text-center"
      role="alert"
    >
      {/* Icon */}
      <div className="rounded-full bg-red-950 p-3 text-red-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="text-xs text-slate-500">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
