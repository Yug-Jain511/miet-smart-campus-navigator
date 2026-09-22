import mietLogo from '../../assets/miet-logo.png';

// Institutional watermark: actual MIET logo at ~4% opacity, large,
// partially off-screen, never interactive. One instance per page max.
export function MIETWatermark({
  position = 'right',
}: {
  position?: 'right' | 'left';
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={mietLogo}
        alt=""
        draggable={false}
        className={`absolute top-1/2 w-[520px] max-w-none -translate-y-1/2 select-none opacity-[0.04] ${
          position === 'right' ? '-right-40' : '-left-40'
        }`}
      />
    </div>
  );
}
