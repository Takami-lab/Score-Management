"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { fromMilli } from "@/lib/scoring/milli";
import { Badge, Table, Th, Td, EmptyState } from "@/components/ui";
import { CATEGORY_LABEL, athleteLabel, type Category } from "@/lib/types";
import type { CategoryResults, AllAroundRow } from "@/lib/aggregate";

type Tab = "aa" | "apparatus" | "team";

export function ResultsView({
  results,
  provisional,
  highlightAthleteId,
  only,
  defaultCategory = "MAG",
}: {
  results: Record<Category, CategoryResults>;
  provisional: boolean;
  highlightAthleteId?: string;
  only?: Tab;
  defaultCategory?: Category;
}) {
  const [cat, setCat] = React.useState<Category>(defaultCategory);
  const [tab, setTab] = React.useState<Tab>(only ?? "aa");
  const cur = results[cat];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex rounded-md border border-[var(--color-border)] overflow-hidden">
          {(["MAG", "WAG"] as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "min-h-9 px-3 text-sm",
                cat === c
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "hover:bg-[var(--color-accent)]",
              )}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        {provisional && <Badge tone="warning">暫定</Badge>}
      </div>

      <div
        className="flex gap-1 border-b border-[var(--color-border)] mb-3"
        hidden={!!only}
      >
        {[
          ["aa", "個人総合"],
          ["apparatus", "種目別"],
          ["team", "団体"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as Tab)}
            className={cn(
              "min-h-10 px-3 text-sm -mb-px border-b-2",
              tab === k
                ? "border-[var(--color-primary)] font-medium"
                : "border-transparent text-[var(--color-muted)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "aa" && (
        <AllAroundTable rows={cur.allAround} highlightAthleteId={highlightAthleteId} />
      )}
      {tab === "apparatus" && (
        <div className="space-y-6">
          {cur.apparatusRankings.map((ar) => (
            <div key={ar.apparatus.id}>
              <h3 className="font-semibold text-sm mb-2">{ar.apparatus.name_ja}</h3>
              {ar.rows.length === 0 ? (
                <EmptyState>確定したスコアがありません</EmptyState>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th className="w-12">順位</Th>
                      <Th>選手</Th>
                      <Th className="text-right">最終</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ar.rows.map((r) => (
                      <tr
                        key={r.athlete.id}
                        className={cn(
                          r.athlete.id === highlightAthleteId && "bg-[var(--color-accent)]",
                        )}
                      >
                        <Td>{r.rank}</Td>
                        <Td>{athleteLabel(r.athlete)}</Td>
                        <Td className="text-right">{fromMilli(r.final)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          ))}
        </div>
      )}
      {tab === "team" && (
        <div className="space-y-6">
          {cur.teams.length === 0 && <EmptyState>チームが未編成です</EmptyState>}
          {cur.teams.map((t) => (
            <div key={t.team.id}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm">
                  {t.rank !== null && `${t.rank}位 　`}
                  {t.team.name}
                </h3>
                <Badge tone={t.memberCount >= t.teamSize ? "neutral" : "warning"}>
                  {t.memberCount}/{t.teamSize}名 登録
                </Badge>
                <span className="text-sm font-semibold tabular ml-auto">
                  総得点 {fromMilli(t.total)}
                </span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>種目</Th>
                    <Th className="text-right">チーム得点</Th>
                    <Th className="text-center">確定状況</Th>
                  </tr>
                </thead>
                <tbody>
                  {t.perApparatus.map((pa) => (
                    <tr key={pa.apparatus.id}>
                      <Td>{pa.apparatus.name_ja}</Td>
                      <Td className="text-right">{fromMilli(pa.score)}</Td>
                      <Td className="text-center">
                        <Badge
                          tone={
                            pa.confirmedCount >= pa.countingCount ? "success" : "warning"
                          }
                        >
                          {pa.confirmedCount}/{pa.countingCount}名確定
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AllAroundTable({
  rows,
  highlightAthleteId,
}: {
  rows: AllAroundRow[];
  highlightAthleteId?: string;
}) {
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  if (rows.length === 0) return <EmptyState>参加選手がいません</EmptyState>;
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-12">順位</Th>
          <Th>選手</Th>
          <Th className="text-center">種目数</Th>
          <Th className="text-right">個人総合</Th>
          <Th className="w-8" />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const isOpen = open.has(r.athlete.id);
          return (
            <React.Fragment key={r.athlete.id}>
              <tr
                className={cn(
                  "cursor-pointer hover:bg-[var(--color-accent)]",
                  r.athlete.id === highlightAthleteId && "bg-[var(--color-accent)]",
                )}
                onClick={() =>
                  setOpen((s) => {
                    const n = new Set(s);
                    if (n.has(r.athlete.id)) n.delete(r.athlete.id);
                    else n.add(r.athlete.id);
                    return n;
                  })
                }
              >
                <Td>{r.rank ?? "—"}</Td>
                <Td>{athleteLabel(r.athlete)}</Td>
                <Td className="text-center text-[var(--color-muted)]">
                  {r.confirmedCount}/{r.totalApparatus}種目
                </Td>
                <Td className="text-right font-medium">{fromMilli(r.total)}</Td>
                <Td className="text-center text-[var(--color-muted)]">
                  {isOpen ? "▲" : "▼"}
                </Td>
              </tr>
              {isOpen && (
                <tr>
                  <Td colSpan={5} className="bg-[var(--color-background)]">
                    <Table>
                      <thead>
                        <tr>
                          <Th>種目</Th>
                          <Th className="text-right">D</Th>
                          <Th className="text-right">E</Th>
                          <Th className="text-right">ND</Th>
                          <Th className="text-right">SB</Th>
                          <Th className="text-right">最終</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.cells.map((c) => (
                          <tr key={c.apparatusId}>
                            <Td>{c.name}</Td>
                            <Td className="text-right">{fromMilli(c.d)}</Td>
                            <Td className="text-right">{fromMilli(c.e)}</Td>
                            <Td className="text-right">
                              {c.nd ? `-${fromMilli(c.nd)}` : "—"}
                            </Td>
                            <Td className="text-right">
                              {c.sb ? `+${fromMilli(c.sb)}` : "—"}
                            </Td>
                            <Td className="text-right font-medium">
                              {c.final === null ? (
                                <span className="text-[var(--color-muted)]">未確定</span>
                              ) : (
                                fromMilli(c.final)
                              )}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}
