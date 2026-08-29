"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { fromMilli } from "@/lib/scoring/milli";
import { Badge, Table, Th, Td, EmptyState } from "@/components/ui";
import { CATEGORY_LABEL, athleteLabel, type Category } from "@/lib/types";
import type { CategoryResults, AllAroundRow, TeamStanding } from "@/lib/aggregate";

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
        <div className="space-y-8">
          {cur.teams.length === 0 && <EmptyState>チームが未編成です</EmptyState>}
          {cur.teams.map((t) => (
            <TeamStandingTable
              key={t.team.id}
              t={t}
              highlightAthleteId={highlightAthleteId}
            />
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
              {isOpen &&
                (() => {
                  const showSB = r.athlete.category === "MAG";
                  return (
                    <tr>
                      <Td colSpan={5} className="bg-[var(--color-background)]">
                        <Table>
                          <thead>
                            <tr>
                              <Th>種目</Th>
                              <Th className="text-right">D</Th>
                              <Th className="text-right">E</Th>
                              <Th className="text-right">ND</Th>
                              {showSB && <Th className="text-right">SB</Th>}
                              <Th className="text-right">最終</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.cells.map((c) => (
                              <tr key={c.apparatusId}>
                                <Td>{c.name}</Td>
                                <Td className="text-right">{fromMilli(c.d, 1)}</Td>
                                <Td className="text-right">{fromMilli(c.e, 3)}</Td>
                                <Td className="text-right">
                                  {c.nd ? `-${fromMilli(c.nd, 1)}` : "—"}
                                </Td>
                                {showSB && (
                                  <Td className="text-right">
                                    {c.sb ? `+${fromMilli(c.sb, 1)}` : "—"}
                                  </Td>
                                )}
                                <Td className="text-right font-medium">
                                  {c.final === null ? (
                                    <span className="text-[var(--color-muted)]">
                                      未確定
                                    </span>
                                  ) : (
                                    fromMilli(c.final, 3)
                                  )}
                                </Td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Td>
                    </tr>
                  );
                })()}
            </React.Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}

function TeamStandingTable({
  t,
  highlightAthleteId,
}: {
  t: TeamStanding;
  highlightAthleteId?: string;
}) {
  const countingCount = t.perApparatus[0]?.countingCount ?? 0;
  return (
    <div>
      {/* ヘッダー: チーム名 / 総得点 / 順位 */}
      <div className="flex items-stretch mb-0 border border-[var(--color-border)] rounded-t-md overflow-hidden text-sm">
        <div className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-bold px-4 py-2 flex items-center min-w-[8rem]">
          {t.team.name}
        </div>
        <div className="px-4 py-2 font-semibold tabular flex items-center border-l border-[var(--color-border)]">
          {fromMilli(t.total)}
        </div>
        <div className="px-4 py-2 flex items-center border-l border-[var(--color-border)]">
          {t.rank !== null ? `${t.rank} 位` : "—"}
        </div>
        <div className="ml-auto px-3 py-2 flex items-center text-xs text-[var(--color-muted)]">
          {t.memberCount}/{t.teamSize}名 ・ 上位{countingCount}名採用
        </div>
      </div>

      <Table className="border border-t-0 border-[var(--color-border)] rounded-b-md">
        <thead>
          <tr>
            <Th className="whitespace-nowrap">選手名</Th>
            <Th className="whitespace-nowrap">所属</Th>
            <Th className="whitespace-nowrap text-center">学年</Th>
            {t.apparatuses.map((ap) => (
              <Th key={ap.id} className="text-right whitespace-nowrap">
                {ap.name_ja}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.members.map((m) => (
            <tr
              key={m.athlete.id}
              className={cn(
                m.athlete.id === highlightAthleteId && "bg-[var(--color-accent)]",
              )}
            >
              <Td className="whitespace-nowrap">
                {m.athlete.last_name} {m.athlete.first_name}
              </Td>
              <Td className="whitespace-nowrap text-[var(--color-muted)]">
                {t.team.name}
              </Td>
              <Td className="text-center text-[var(--color-muted)]">
                {m.athlete.affiliation ?? "—"}
              </Td>
              {m.cells.map((c) => (
                <Td
                  key={c.apparatusId}
                  className={cn(
                    "text-right tabular",
                    c.final !== null && !c.counted && "text-[var(--color-danger)]",
                  )}
                >
                  {c.final === null ? "—" : fromMilli(c.final)}
                </Td>
              ))}
            </tr>
          ))}
          <tr className="font-semibold bg-[var(--color-background)]">
            <Td className="whitespace-nowrap" colSpan={3}>
              ベスト{countingCount}
            </Td>
            {t.perApparatus.map((pa) => (
              <Td
                key={pa.apparatus.id}
                className={cn(
                  "text-right tabular",
                  pa.confirmedCount < pa.countingCount &&
                    pa.confirmedCount > 0 &&
                    "text-[var(--color-warning)]",
                )}
              >
                {fromMilli(pa.score)}
              </Td>
            ))}
          </tr>
        </tbody>
      </Table>
      <p className="mt-1.5 text-xs text-[var(--color-muted)]">
        <span className="text-[var(--color-danger)]">赤字</span>
        は各種目で上位{countingCount}名に入らず、チーム得点に採用されなかった得点。
        オレンジのベスト{countingCount}は確定人数が {countingCount} 名未満の途中集計。
      </p>
    </div>
  );
}
