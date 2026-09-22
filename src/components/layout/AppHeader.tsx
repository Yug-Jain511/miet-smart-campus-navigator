import { NavLink } from 'react-router-dom';
import mietLogo from '../../assets/miet-logo.png';

function HeaderLink({ to, end, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative px-1 py-2 text-[13px] font-semibold tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
          isActive ? 'text-ink-deep' : 'text-ink-soft hover:text-ink-deep'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 -bottom-[1px] h-[2px] bg-brand transition-transform duration-200 ${
              isActive ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-ink-deep/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <NavLink to="/" className="flex items-center gap-2.5" aria-label="MIET Smart Campus Navigator home">
          <img
            src={mietLogo}
            alt="MIET logo"
            className="h-8 w-8 rounded-md bg-white object-contain p-0.5 ring-1 ring-ink-deep/10"
          />
          <span className="leading-tight">
            <span className="block text-[13px] font-extrabold tracking-[0.08em] text-ink-deep">
              MIET
            </span>
            <span className="block text-[11px] font-medium text-ink-soft">
              Smart Campus Navigator
            </span>
          </span>
        </NavLink>
        <nav aria-label="Primary" className="ml-auto flex items-center gap-4 sm:gap-5">
          <HeaderLink to="/" end>Home</HeaderLink>
          <HeaderLink to="/navigate">Navigate</HeaderLink>
          <HeaderLink to="/explore">Explore</HeaderLink>
          <HeaderLink to="/admin">Admin</HeaderLink>
        </nav>
      </div>
    </header>
  );
}
