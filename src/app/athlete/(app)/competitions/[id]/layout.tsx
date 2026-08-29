import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { getCompetition, isEntered } from "@/lib/db/queries";
import { Badge } from "@/components/ui";
import { TabNav } from "@/components/tab-nav";
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
      <TabNav
        items={[
          { href: `/athlete/competitions/${id}`, label: "D スコア入力" },
          { href: `/athlete/competitions/${id}/results`, label: "結果・順位" },
        ]}
      />
      {children}
    </div>
  );
}
