import type { CampusLocation } from '../../models/types';

export function LocationSelector({
  label,
  locations,
  value,
  onChange,
  id,
}: {
  label: string;
  locations: CampusLocation[];
  value: string | null;
  onChange: (id: string) => void;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
        {label.toUpperCase()}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-control border border-ink-deep/20 bg-white px-3 py-2.5 text-sm text-ink-deep focus:border-ink-deep/40 focus:outline-none focus:ring-2 focus:ring-brand/25"
      >
        <option value="">Select location…</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}
