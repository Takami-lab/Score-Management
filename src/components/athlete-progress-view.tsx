"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { ScoreChart, chartLabel, type ChartPoint } from "@/components/score-chart";
import { EmptyState } from "@/components/ui";
import type { AthleteSeries } from "@/lib/db/series";

type Metric = "final" | "d" | "e";
const METRIC_LABEL: Record<Metric, string> = {
  final: "最終スコア",
  d: "D スコア",
  e: "E スコア",
};

export function AthleteProgressView({ series }: { series: AthleteSeries }) {
  // "aa" = 個人総合 / それ以外は種目 ID
  const [tab, setTab] = React.useState<"aa" | number>("aa");
  const [metric, setMetric] = React.useState<Metric>("final");

  if (series.points.length === 0) {
    return (
      <EmptyState>
        確定済みの試技会の記録がまだありません。
        <br />
        試技会のステータスが「確定」になると、ここに推移が表示されます。
      </EmptyState>
    );
  }

  const points: ChartPoint[] =
    tab === "aa"
      ? series.points.map((p) => ({
          label: chartLabel(p.competition.held_on),
          title: p.competition.name,
          value: p.allAroundTotal,
          complete: p.complete,
          note: `${p.confirmedCount}/${p.totalApparatus}種目`,
        }))
      : series.points.map((p) => {
          const cell = p.perApparatus.find((a) => a.apparatusId === tab);
          const value =
            metric === "final" ? (cell?.final ?? null)
            : metric === "d" ? (cell?.d ?? null)
            : (cell?.e ?? null);
          const parts: string[] = [];
          if (cell?.d !== null && cell?.d !== undefined) parts.push(`D ${(cell.d / 1000).toFixed(1)}`);
          if (cell?.e !== null && cell?.e !== undefined) parts.push(`E ${(cell.e / 1000).toFixed(3)}`);
          if (cell?.nd) parts.push(`ND -${(cell.nd / 1000).toFixed(1)}`);
          if (cell?.sb) parts.push(`SB +${(cell.sb / 1000).toFixed(1)}`);
          return {
            label: chartLabel(p.competition.held_on),
            title: p.competition.name,
            value,
            complete: true,
            note: parts.join(" / ") || undefined,
          };
        });

  const places = tab === "aa" ? 3 : metric === "d" ? 1 : 3;

  return (
    <div className="space-y-3">
      {/* 個人総合 / 種目 の切替 */}
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="flex gap-1.5 w-max">
          <TabButton active={tab === "aa"} onClick={() => setTab("aa")}>
            個人総合
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

      {/* 種目のときだけ 最終 / D / E の切替 */}
      {tab !== "aa" && (
        <div className="flex gap-1.5">
          {(["final", "d", "e"] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={cn(
                "min-h-9 px-3 rounded-md text-sm border",
                metric === m
                  ? "bg-[var(--color-accent)] border-[var(--color-primary)] font-semibold"
                  : "border-[var(--color-border)] hover:bg-[var(--color-accent)]",
              )}
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      )}

      <ScoreChart points={points} places={places} />

      {tab === "aa" && series.points.some((p) => !p.complete) && (
        <p className="text-xs text-[var(--color-muted)]">
          ※ 白抜きの点は全種目そろっていない試技会です。合計値なので他の点とは単純比較できません。
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
