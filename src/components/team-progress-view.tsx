"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { ScoreChart, chartLabel, type ChartPoint } from "@/components/score-chart";
import { EmptyState } from "@/components/ui";
import type { TeamSeries } from "@/lib/db/series";

export function TeamProgressView({ series }: { series: TeamSeries }) {
  // "total" = 総得点 / それ以外は種目 ID
  const [tab, setTab] = React.useState<"total" | number>("total");

  if (series.points.length === 0) {
    return (
      <EmptyState>
        このチームの、確定済み試技会での記録がまだありません。
      </EmptyState>
    );
  }

  const points: ChartPoint[] =
    tab === "total"
      ? series.points.map((p) => ({
          label: chartLabel(p.competition.held_on),
          title: p.competition.name,
          value: p.total,
          complete: p.complete,
          note: `${p.memberCount}名登録 ・ 上位${p.countingCount}名採用`,
        }))
      : series.points.map((p) => {
          const cell = p.perApparatus.find((a) => a.apparatusId === tab);
          return {
            label: chartLabel(p.competition.held_on),
            title: p.competition.name,
            value: cell?.score ?? null,
            complete: (cell?.confirmedCount ?? 0) >= p.countingCount,
            note: `${cell?.confirmedCount ?? 0}/${p.countingCount}名確定`,
          };
        });

  return (
    <div className="space-y-3">
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="flex gap-1.5 w-max">
          <TabButton active={tab === "total"} onClick={() => setTab("total")}>
            総得点
          </TabButton>
          {series.apparatuses.map((ap) => (
            <TabButton
              key={ap.id}
              active={tab === ap.id}
              onClick={() => setTab(ap.id)}
            >
              {ap.name_ja}
            </TabButton>
          ))}
        </div>
      </div>

      <ScoreChart points={points} places={3} />

      {series.points.some((p) => !p.complete) && (
        <p className="text-xs text-[var(--color-muted)]">
          ※ 白抜きの点は採用人数ぶん確定していない試技会です（途中集計）。
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 px-4 rounded-md text-sm whitespace-nowrap border",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent font-semibold"
          : "border-[var(--color-border)] hover:bg-[var(--color-accent)]",
      )}
    >
      {children}
    </button>
  );
}
