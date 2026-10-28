"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-surface">
      <div className="site-header-inner">
        <span className="text-lg font-semibold text-brand-navy">
          EUC Events Hub
        </span>
        <nav aria-label="Primary navigation">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
            Student calendar
          </Link>
          <Link
            href="/planner"
            aria-current={pathname === "/planner" ? "page" : undefined}
          >
            Organization planner
          </Link>
        </nav>
        <span className="header-preview">Development preview</span>
      </div>
    </header>
  );
}
