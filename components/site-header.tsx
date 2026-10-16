export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-baseline justify-between gap-3 px-5 py-5 sm:px-8">
        <span className="text-lg font-semibold text-brand-navy">
          EUC Events Hub
        </span>
        <span className="text-sm text-foreground-muted">
          Student calendar · Development preview
        </span>
      </div>
    </header>
  );
}
