import { MapPinCheck } from 'lucide-react';

/** Slim confirmation strip after a valid QR scan. */
export function YouAreHereBanner({
  locationName,
  onClear,
}: {
  locationName: string;
  onClear: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 border-y border-green-800/15 bg-green-50/70 px-1 py-2"
    >
      <MapPinCheck className="h-4 w-4 shrink-0 text-green-800" aria-hidden="true" />
      <p className="text-[13px] text-green-900">
        <span className="font-bold">{locationName}</span>
        <span className="text-green-800"> — location confirmed by QR</span>
      </p>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto shrink-0 px-2 py-1 text-xs font-semibold text-green-900 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
      >
        Clear
      </button>
    </div>
  );
}
