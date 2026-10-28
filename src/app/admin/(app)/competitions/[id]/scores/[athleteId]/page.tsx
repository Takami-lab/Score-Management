import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAthlete,
  getCompetition,
  listAthleteRoutineRows,
  listEntryAthletes,
} from "@/lib/db/queries";
import { RoutineScoreForm } from "@/components/routine-score-form";
import { Card, CardBody, Badge } from "@/components/ui";
import { ADMIN_SCORING_STATUSES, athleteLabel, STATUS_LABEL } from "@/lib/types";

export default async function AdminScorePage({
  params,
}: {
  params: Promise<{ id: string; athleteId: string }>;
}) {
  const { id, athleteId } = await params;
  const [comp, athlete, rows, entries] = await Promise.all([
    getCompetition(id),
    getAthlete(athleteId),
    listAthleteRoutineRows(id, athleteId),
    listEntryAthletes(id),
  ]);
  if (!comp || !athlete) notFound();

  const sameCat = entries.filter((a) => a.category === athlete.category);
  const idx = sameCat.findIndex((a) => a.id === athleteId);
  const nextAthleteId = idx >= 0 && idx < sameCat.length - 1 ? sameCat[idx + 1].id : null;
  const prevAthleteId = idx > 0 ? sameCat[idx - 1].id : null;

  const canEdit = ADMIN_SCORING_STATUSES.includes(comp.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/admin/competitions/${id}`} className="text-sm text-[var(--color-muted)]">
          ← 選手一覧
        </Link>
        <div className="flex gap-2 text-sm">
          {prevAthleteId && (
            <Link
              href={`/admin/competitions/${id}/scores/${prevAthleteId}`}
              className="text-[var(--color-primary)]"
            >
              ← 前の選手
            </Link>
          )}
          {nextAthleteId && (
            <Link
              href={`/admin/competitions/${id}/scores/${nextAthleteId}`}
              className="text-[var(--color-primary)]"
            >
              次の選手 →
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardBody>
          {canEdit ? (
            <RoutineScoreForm
              competitionId={id}
              athleteId={athleteId}
              athleteName={athleteLabel(athlete)}
              routineRows={rows}
              nextAthleteId={nextAthleteId}
              editableD
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
