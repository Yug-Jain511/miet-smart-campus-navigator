export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-control border border-dashed border-ink-deep/15 bg-transparent px-4 py-6 text-center text-sm text-ink-soft">
      <p className="font-semibold text-ink-deep">{title}</p>
      {hint ? <p className="mt-1">{hint}</p> : null}
    </div>
  );
}
