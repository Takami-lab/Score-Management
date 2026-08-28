"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Competition } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

export function Calendar({ competitions }: { competitions: Competition[] }) {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month0, setMonth0] = React.useState(now.getMonth());

  const byDay = new Map<string, Competition[]>();
  for (const c of competitions) {
    const arr = byDay.get(c.held_on) ?? [];
    arr.push(c);
    byDay.set(c.held_on, arr);
  }

  const first = new Date(year, month0, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) => {
    const d = new Date(year, month0 + delta, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shift(-1)} className="min-h-9 px-3 rounded-md hover:bg-[var(--color-accent)]">
          ← 前月
        </button>
        <div className="font-semibold">
          {year}年 {month0 + 1}月
        </div>
        <button onClick={() => shift(1)} className="min-h-9 px-3 rounded-md hover:bg-[var(--color-accent)]">
          翌月 →
        </button>
      </div>
      <div className="grid grid-cols-7 border-l border-t border-[var(--color-border)]">
        {WD.map((w, i) => (
          <div
            key={w}
            className={cn(
              "text-xs font-medium text-center py-1.5 border-r border-b border-[var(--color-border)] bg-[var(--color-surface)]",
              i === 0 && "text-[var(--color-danger)]",
              i === 6 && "text-[var(--color-primary)]",
            )}
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          const key = day ? `${year}-${pad(month0 + 1)}-${pad(day)}` : `e${i}`;
          const events = day ? (byDay.get(key) ?? []) : [];
          return (
            <div
              key={key}
              className="min-h-24 p-1.5 border-r border-b border-[var(--color-border)] bg-[var(--color-surface)] align-top"
            >
              {day && (
                <>
                  <div className="text-xs text-[var(--color-muted)]">{day}</div>
                  <div className="space-y-1 mt-1">
                    {events.map((c) => (
                      <Link
                        key={c.id}
                        href={`/admin/competitions/${c.id}`}
                        className="block rounded bg-[var(--color-accent)] px-1.5 py-1 text-xs hover:opacity-80"
                      >
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-[10px] text-[var(--color-muted)]">
                          {STATUS_LABEL[c.status]}
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
