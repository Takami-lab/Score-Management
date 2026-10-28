import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getApparatus,
  getCompetition,
  listApparatuses,
  listApparatusRoutineRows,
  listEntryAthletes,
} from "@/lib/db/queries";
import { ApparatusScoreForm } from "@/components/apparatus-score-form";
import { Card, CardBody, Badge } from "@/components/ui";
import { ADMIN_SCORING_STATUSES, CATEGORY_LABEL, STATUS_LABEL } from "@/lib/types";

export default async function AdminApparatusScorePage({
  params,
}: {
  params: Promise<{ id: string; apparatusId: string }>;
}) {
  const { id, apparatusId } = await params;
  const apId = Number(apparatusId);
  const [comp, apparatus, allApparatuses, entries, rows] = await Promise.all([
    getCompetition(id),
    getApparatus(apId),
    listApparatuses(),
    listEntryAthletes(id),
    listApparatusRoutineRows(id, apId),
  ]);
  if (!comp || !apparatus) notFound();

  const athletes = entries.filter((a) => a.category === apparatus.category);
  const sameCat = allApparatuses
    .filter((a) => a.category === apparatus.category)
    .sort((a, b) => a.sort_order - b.sort_order);
  const idx = sameCat.findIndex((a) => a.id === apId);
  const prevAp = idx > 0 ? sameCat[idx - 1] : null;
  const nextAp = idx >= 0 && idx < sameCat.length - 1 ? sameCat[idx + 1] : null;

  const canEdit = ADMIN_SCORING_STATUSES.includes(comp.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          href={`/admin/competitions/${id}`}
          className="text-sm text-[var(--color-muted)]"
        >
          ← 選手一覧
        </Link>
        <div className="flex gap-3 text-sm">
          {prevAp && (
            <Link
              href={`/admin/competitions/${id}/apparatus/${prevAp.id}`}
              className="text-[var(--color-primary)]"
            >
              ← {prevAp.name_ja}
            </Link>
          )}
          {nextAp && (
            <Link
              href={`/admin/competitions/${id}/apparatus/${nextAp.id}`}
              className="text-[var(--color-primary)]"
            >
              {nextAp.name_ja} →
            </Link>
          )}
        </div>
      </div>

      {/* 同カテゴリの種目をすばやく切り替え */}
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">{CATEGORY_LABEL[apparatus.category]}</Badge>
        {sameCat.map((a) => (
          <Link
            key={a.id}
            href={`/admin/competitions/${id}/apparatus/${a.id}`}
            className={
              "min-h-9 px-3 inline-flex items-center rounded-md text-sm border " +
              (a.id === apId
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent font-semibold"
                : "border-[var(--color-border)] hover:bg-[var(--color-accent)]")
            }
          >
            {a.name_ja}
          </Link>
        ))}
      </div>

      <Card>
        <CardBody>
          {athletes.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              {CATEGORY_LABEL[apparatus.category]}の参加選手がいません。
            </p>
          ) : canEdit ? (
            <ApparatusScoreForm
              competitionId={id}
              apparatusId={apId}
              apparatusName={apparatus.name_ja}
              athletes={athletes}
              routineRows={rows}
              nextApparatusId={nextAp?.id ?? null}
            />
          ) : (
            <p className="text-sm">
              現在のステータス「{STATUS_LABEL[comp.status]}」では採点入力できません。
              <Badge tone="neutral" className="ml-2">
                {comp.status}
              </Badge>
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
