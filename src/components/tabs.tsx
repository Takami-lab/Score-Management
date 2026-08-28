"use client";
import * as React from "react";
import { cn } from "@/lib/cn";

export function ClientTabs({
  tabs,
}: {
  tabs: { key: string; label: React.ReactNode; content: React.ReactNode }[];
}) {
  const [active, setActive] = React.useState(tabs[0]?.key);
  return (
    <div>
      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "min-h-10 px-4 rounded-md text-sm",
              active === t.key
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "border border-[var(--color-border)] hover:bg-[var(--color-accent)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} hidden={active !== t.key}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
