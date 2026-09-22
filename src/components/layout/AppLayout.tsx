import type { ReactNode } from 'react';
import { CampusBackdrop } from '../brand/CampusBackdrop';
import { AppHeader } from './AppHeader';

export function AppLayout({ children }: { children: ReactNode }) {
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
