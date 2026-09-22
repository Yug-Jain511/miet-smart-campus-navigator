import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, DoorOpen, Library } from 'lucide-react';

function RowIcon({ iconKey }: { iconKey?: string }) {
  const key = (iconKey ?? 'building').toLowerCase();
  const Icon = key === 'gate' ? DoorOpen : key === 'library' ? Library : Building2;
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink-deep/15 bg-white text-ink-deep"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function LocationCard({
  name,
  category,
  description,
  locationId,
  icon,
}: {
  name: string;
  category: string;
  description?: string;
  locationId: string;
  icon?: string;
}) {
  return (
    <Link
      to={`/navigate?destination=${locationId}`}
      className="group flex items-center gap-4 border-b border-ink-deep/10 py-4 transition-colors duration-150 hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
      aria-label={`${name} — navigate here`}
    >
      <RowIcon iconKey={icon} />
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] font-bold tracking-[0.14em] text-ink-soft">
          {category.toUpperCase()}
        </span>
        <span className="block truncate text-[15px] font-bold text-ink-deep">{name}</span>
        {description ? (
          <span className="block truncate text-[13px] text-ink-soft">{description}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] font-bold tracking-wider text-ink-soft transition-colors group-hover:text-brand">
        NAVIGATE
        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" aria-hidden="true" />
      </span>
    </Link>
  );
}
