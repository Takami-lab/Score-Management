import { getCompetition, listEntryAthletes, listRoutineRows } from "@/lib/db/queries";
import { computeProgress } from "@/lib/progress";
import { ClientTabs } from "@/components/tabs";
import { Table, Th, Td, Badge, EmptyState, LinkButton } from "@/components/ui";
import { CATEGORY_LABEL, athleteLabel, type Category } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comp = await getCompetition(id);
  if (!comp) notFound();
  const [athletes, rows] = await Promise.all([
    listEntryAthletes(id),
    listRoutineRows(id),
  ]);
  const progress = computeProgress(rows);

  const section = (cat: Category) => {
    const list = athletes.filter((a) => a.category === cat);
    if (list.length === 0)
      return <EmptyState>参加選手がいません。「設定」タブから追加してください。</EmptyState>;
    return (
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
                <Td>{athleteLabel(a)}</Td>
                <Td>
                  <Badge tone={p && p.dDone === total && total > 0 ? "success" : "neutral"}>
                    D {p?.dDone ?? 0}/{total}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={p && p.eDone === total && total > 0 ? "success" : "neutral"}>
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
