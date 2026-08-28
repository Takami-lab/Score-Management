import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { getCompetition, isEntered } from "@/lib/db/queries";
import { Badge } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/types";

export default async function AthleteCompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/athlete/login");
  const comp = await getCompetition(id);
  if (!comp || comp.status === "draft") notFound();
  if (!(await isEntered(id, athlete.id))) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/athlete/competitions" className="text-sm text-[var(--color-muted)]">
          ← 試技会一覧
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-xl font-bold">{comp.name}</h1>
          <Badge tone="primary">{STATUS_LABEL[comp.status]}</Badge>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {comp.held_on}
          {comp.venue ? ` ・ ${comp.venue}` : ""}
        </p>
      </div>
      <nav className="flex gap-1 border-b border-[var(--color-border)]">
        <Link
          href={`/athlete/competitions/${id}`}
          className="min-h-10 px-3 flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          D スコア入力
        </Link>
        <Link
          href={`/athlete/competitions/${id}/results`}
          className="min-h-10 px-3 flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          結果・順位
        </Link>
      </nav>
      {children}
    </div>
  );
}
