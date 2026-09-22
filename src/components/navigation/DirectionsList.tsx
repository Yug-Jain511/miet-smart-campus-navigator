export function DirectionsList({ directions }: { directions: string[] }) {
  return (
    <ol className="divide-y divide-ink-deep/10" aria-label="Turn-by-turn directions">
      {directions.map((step, i) => (
        <li key={i} className="flex items-baseline gap-3 py-2 text-[13px] leading-relaxed">
          <span
            aria-hidden="true"
            className={`font-mono text-[11px] font-bold tabular-nums ${
              i === directions.length - 1 ? 'text-brand' : 'text-ink-soft'
            }`}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-ink-deep">{step}</span>
        </li>
      ))}
    </ol>
  );
}
