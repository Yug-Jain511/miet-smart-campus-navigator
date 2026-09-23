import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import mietLogo from '../../assets/miet-logo.png';
import { CampusBackdrop } from '../brand/CampusBackdrop';
import { AppHeader } from './AppHeader';

/** Minimal floating chrome for the full-screen navigation view. */
function NavigateChrome() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] flex items-start justify-between gap-2 p-2.5 sm:p-3">
      <Link
        to="/"
        aria-label="Back to destination selection"
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-control bg-white/95 text-ink-deep shadow ring-1 ring-ink-deep/10 transition-all duration-200 hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <span className="pointer-events-auto flex items-center gap-1.5 rounded-control bg-white/95 py-1.5 pl-1.5 pr-3 shadow ring-1 ring-ink-deep/10">
        <img src={mietLogo} alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
        <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-ink-deep">
          MIET NAVIGATOR
        </span>
      </span>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // Full-screen takeover for the navigation experience: the map owns the
  // viewport, so the normal header/container/footer are skipped on /navigate.
  if (pathname === '/navigate') {
    return (
      <div className="relative h-[100dvh] overflow-hidden bg-paper font-sans text-ink-deep">
        <NavigateChrome />
        {children}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-paper font-sans text-ink-deep">
      <CampusBackdrop />
      <AppHeader />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14 pt-6">{children}</main>
      <footer className="relative z-10 border-t border-ink-deep/10 bg-paper">
        <p className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-2 px-4 py-3 text-[11px] tracking-wide text-ink-soft">
          <span className="font-extrabold tracking-[0.08em] text-ink-deep">MIET</span>
          <span>Meerut Institute of Engineering &amp; Technology · Smart Campus Navigator</span>
          <span className="ml-auto">Google Maps gets you to MIET — this gets you around inside.</span>
        </p>
      </footer>
    </div>
  );
}
