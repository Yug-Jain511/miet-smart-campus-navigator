export function LoadingSpinner({ label = 'Loading campus map…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 p-6 text-ink-soft">
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink-deep/20 border-t-brand"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
