import Link from "next/link";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { listAthleteCompetitions, listAthleteRoutineRows } from "@/lib/db/queries";
import { Card, CardBody, Badge, EmptyState } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function AthleteCompetitionsPage() {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/athlete/login");
  const competitions = await listAthleteCompetitions(athlete.id);

  const progress = await Promise.all(
    competitions.map(async (c) => {
      const rows = await listAthleteRoutineRows(c.id, athlete.id);
      const dDone = rows.filter((r) => r.d_score !== null).length;
      return { id: c.id, dDone, total: rows.length };
    }),
  );
  const pmap = new Map(progress.map((p) => [p.id, p]));

  if (competitions.length === 0) {
    return <EmptyState>参加予定の試技会はまだありません。</EmptyState>;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">試技会一覧</h1>
      {competitions.map((c) => {
        const p = pmap.get(c.id);
        return (
          <Link key={c.id} href={`/athlete/competitions/${c.id}`}>
            <Card className="hover:bg-[var(--color-accent)] transition-colors">
              <CardBody className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">
                    {c.held_on}
                    {c.venue ? ` ・ ${c.venue}` : ""}
                  </div>
                </div>
                <Badge tone="neutral">{STATUS_LABEL[c.status]}</Badge>
                <Badge tone={p && p.dDone === p.total && p.total > 0 ? "success" : "warning"}>
                  D {p?.dDone ?? 0}/{p?.total ?? 0}
                </Badge>
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
