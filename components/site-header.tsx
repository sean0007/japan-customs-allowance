"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Checker" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line/80">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="font-mono text-[11px] tracking-[0.22em] text-amber uppercase">Free</span>
          <span className="text-sm font-semibold tracking-tight text-foreground sm:text-base">Japan Customs Allowance</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm text-muted sm:gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-2.5 py-1 hover:bg-white/5 hover:text-foreground ${active ? "bg-white/10 text-foreground" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
