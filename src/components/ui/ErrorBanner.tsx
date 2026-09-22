export function ErrorBanner({
  message,
  tone = 'error',
}: {
  message: string;
  tone?: 'error' | 'warn';
}) {
  return (
    <div
      role="alert"
      className={`rounded-control border px-3 py-2.5 text-[13px] font-medium ${
        tone === 'warn'
          ? 'border-amber-600/25 bg-amber-50 text-amber-900'
          : 'border-red-700/20 bg-red-50 text-red-800'
      }`}
    >
      {message}
    </div>
  );
}
