import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompetition,
  listApparatuses,
  listEntryAthletes,
  listRoutineRows,
} from "@/lib/db/queries";
import { computeProgress, computeApparatusProgress } from "@/lib/progress";
import { ClientTabs } from "@/components/tabs";
import { Table, Th, Td, Badge, EmptyState, LinkButton } from "@/components/ui";
import { CATEGORY_LABEL, athleteLabel, type Category } from "@/lib/types";

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comp = await getCompetition(id);
  if (!comp) notFound();
  const [athletes, rows, apparatuses] = await Promise.all([
    listEntryAthletes(id),
    listRoutineRows(id),
    listApparatuses(),
  ]);
  const progress = computeProgress(rows);
  const apProgress = computeApparatusProgress(rows);

  const section = (cat: Category) => {
    const list = athletes.filter((a) => a.category === cat);
    if (list.length === 0)
      return <EmptyState>参加選手がいません。「設定」タブから追加してください。</EmptyState>;

    const catApparatuses = apparatuses
      .filter((a) => a.category === cat)
      .sort((a, b) => a.sort_order - b.sort_order);

    return (
      <div className="space-y-6">
        {/* 種目ごとに入力 */}
        <div>
          <h3 className="text-sm font-semibold mb-2">種目ごとに入力</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {catApparatuses.map((ap) => {
              const p = apProgress.get(ap.id);
              const total = p?.total ?? 0;
              const done = p?.eDone ?? 0;
              return (
                <Link
                  key={ap.id}
                  href={`/admin/competitions/${id}/apparatus/${ap.id}`}
                  className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 hover:bg-[var(--color-accent)] transition-colors"
                >
                  <span className="font-medium text-sm flex-1">{ap.name_ja}</span>
                  <Badge tone={p && p.dDone === total && total > 0 ? "success" : "neutral"}>
                    D {p?.dDone ?? 0}/{total}
                  </Badge>
                  <Badge tone={done === total && total > 0 ? "success" : "neutral"}>
                    E {done}/{total}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 選手ごとに入力 */}
        <div>
          <h3 className="text-sm font-semibold mb-2">選手ごとに入力</h3>
          <Table>
            <thead>
              <tr>
                <Th>選手</Th>
                <Th>D 入力</Th>
                <Th>E 入力</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const p = progress.get(a.id);
                const total = p?.total ?? 0;
                return (
                  <tr key={a.id}>
                    <Td className="whitespace-nowrap">{athleteLabel(a)}</Td>
                    <Td>
                      <Badge
                        tone={p && p.dDone === total && total > 0 ? "success" : "neutral"}
                      >
                        D {p?.dDone ?? 0}/{total}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        tone={p && p.eDone === total && total > 0 ? "success" : "neutral"}
                      >
                        E {p?.eDone ?? 0}/{total}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <LinkButton
                        size="sm"
                        variant="secondary"
                        href={`/admin/competitions/${id}/scores/${a.id}`}
                      >
                        採点入力
                      </LinkButton>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <ClientTabs
      tabs={(["MAG", "WAG"] as Category[]).map((cat) => ({
        key: cat,
        label: `${CATEGORY_LABEL[cat]} (${athletes.filter((a) => a.category === cat).length})`,
        content: section(cat),
      }))}
    />
  );
}
