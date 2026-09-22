import { Link } from 'react-router-dom';
import { MIETWatermark } from '../../components/brand/MIETWatermark';
import { useApp } from '../../context/AppContext';
import { LocationCard } from '../../components/explore/LocationCard';

export function ExplorePage() {
  const { campus } = useApp();

  return (
    <div className="relative">
      <MIETWatermark position="left" />
      <div className="relative">
        <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-ink">
          CAMPUS DIRECTORY
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.01em] text-ink-deep">
          Explore Campus
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {campus.counts.locations} locations on the {campus.datasetInfo.campusName} map. Select one to navigate.
        </p>
      </div>
      <div className="relative mt-2 border-t border-ink-deep/10">
        {campus.locations.map((loc) => (
          <LocationCard
            key={loc.id}
            locationId={loc.id}
            name={loc.name}
            category={loc.category}
            description={loc.description}
            icon={loc.icon}
          />
        ))}
      </div>
      <p className="relative mt-4 text-sm">
        <Link to="/navigate" className="font-semibold text-brand-ink hover:underline">
          Open navigation →
        </Link>
      </p>
    </div>
  );
}
