import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompetition } from "@/lib/db/queries";
import { Badge } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/types";

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comp = await getCompetition(id);
  if (!comp) notFound();

  const tabs = [
    ["", "詳細・採点"],
    ["/settings", "設定"],
    ["/teams", "団体編成"],
    ["/results", "結果"],
  ];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/dashboard" className="text-sm text-[var(--color-muted)]">
          ← カレンダー
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-xl font-bold">{comp.name}</h1>
          <Badge tone="primary">{STATUS_LABEL[comp.status]}</Badge>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {comp.held_on}
          {comp.venue ? ` ・ ${comp.venue}` : ""}
        </p>
      </div>
      <nav className="flex gap-1 border-b border-[var(--color-border)]">
        {tabs.map(([suffix, label]) => (
          <Link
            key={suffix}
            href={`/admin/competitions/${id}${suffix}`}
            className="min-h-10 px-3 flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
