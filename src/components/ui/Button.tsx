import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
};

export function Button({ variant = 'primary', children, className = '', ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark min-h-[44px] active:translate-y-0';
  const styles =
    variant === 'primary'
      ? 'bg-brand text-white hover:bg-brand-dark disabled:opacity-50 disabled:hover:translate-y-0'
      : variant === 'secondary'
        ? 'border border-ink-deep/15 bg-white text-ink-deep hover:border-ink-deep/30 hover:bg-paper'
        : 'text-brand-ink hover:bg-brand-tint';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
