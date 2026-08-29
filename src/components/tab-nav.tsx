"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** 現在地が分かるタブ型ナビ。exact 一致で「表示中」を判定し、青く強調する。 */
export function TabNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-[var(--color-border)]">
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "min-h-11 px-4 flex items-center text-sm -mb-px border-b-2 transition-colors",
              active
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
