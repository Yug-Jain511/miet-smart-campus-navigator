// Ambient "live navigation system" backdrop: one faint drifting grid +
// a handful of breathing node dots. CSS-only, pointer-transparent,
// disabled under prefers-reduced-motion. Rendered once in AppLayout.

const DOTS = [
  { left: '8%', top: '22%', delay: '0s' },
  { left: '18%', top: '68%', delay: '1.2s' },
  { left: '31%', top: '34%', delay: '2.1s' },
  { left: '47%', top: '74%', delay: '0.6s' },
  { left: '58%', top: '18%', delay: '3s' },
  { left: '66%', top: '52%', delay: '1.8s' },
  { left: '76%', top: '30%', delay: '2.6s' },
  { left: '84%', top: '66%', delay: '0.9s' },
  { left: '91%', top: '42%', delay: '3.6s' },
  { left: '40%', top: '12%', delay: '4.2s' },
  { left: '12%', top: '86%', delay: '2.9s' },
  { left: '70%', top: '86%', delay: '1.5s' },
];

export function CampusBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="miet-backdrop-grid absolute -inset-12" />
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="miet-node-dot"
          style={{ left: d.left, top: d.top, animationDelay: d.delay }}
        />
      ))}
      {/* Soft radial light, static — lifts the top without motion. */}
      <div
        className="absolute inset-x-0 top-0 h-72"
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(226,33,38,0.045), transparent 70%)' }}
      />
    </div>
  );
}
