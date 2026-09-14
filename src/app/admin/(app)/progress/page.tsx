import Link from "next/link";
import {
  getAthlete,
  getTeamProfile,
  listAllAthletes,
  listTeamProfiles,
} from "@/lib/db/queries";
import { getAthleteSeries, getTeamSeries } from "@/lib/db/series";
import { AthleteProgressView } from "@/components/athlete-progress-view";
import { TeamProgressView } from "@/components/team-progress-view";
import { ProgressPicker } from "@/components/progress-picker";
import { Card, CardBody, EmptyState } from "@/components/ui";
import { CATEGORY_LABEL, athleteLabel } from "@/lib/types";
import { cn } from "@/lib/cn";

export default async function AdminProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; athlete?: string; team?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "team" ? "team" : "athlete";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">得点推移</h1>
        <p className="text-sm text-[var(--color-muted)]">
          確定済みの試技会のみを対象に表示します。
        </p>
      </div>

      <nav className="flex gap-1 border-b border-[var(--color-border)]">
        {[
          { key: "athlete", label: "選手別" },
          { key: "team", label: "団体" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/admin/progress?tab=${t.key}`}
            className={cn(
              "min-h-11 px-4 flex items-center text-sm -mb-px border-b-2",
              tab === t.key
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "athlete" ? (
        <AthleteTab athleteId={sp.athlete} />
      ) : (
        <TeamTab teamId={sp.team} />
      )}
    </div>
  );
}

async function AthleteTab({ athleteId }: { athleteId?: string }) {
  const athletes = await listAllAthletes();
  const selected = athleteId ? await getAthlete(athleteId) : null;

  return (
    <div className="space-y-4">
      <ProgressPicker
        label="選手"
        name="athlete"
        value={selected?.id ?? ""}
        options={athletes.map((a) => ({
          value: a.id,
          label: athleteLabel(a) + (a.is_active ? "" : "（無効）"),
          group: CATEGORY_LABEL[a.category],
        }))}
        hrefPrefix="/admin/progress?tab=athlete&athlete="
      />
      {selected ? (
        <Card>
          <CardBody>
            <h2 className="text-base font-semibold mb-3">
              {athleteLabel(selected)}
            </h2>
            <AthleteProgressView series={await getAthleteSeries(selected)} />
          </CardBody>
        </Card>
      ) : (
        <EmptyState>選手を選ぶと得点推移が表示されます。</EmptyState>
      )}
    </div>
  );
}

async function TeamTab({ teamId }: { teamId?: string }) {
  const profiles = await listTeamProfiles();
  const selected = teamId ? await getTeamProfile(teamId) : null;

  if (profiles.length === 0) {
    return (
      <EmptyState>
        チームがまだありません。試技会の「団体編成」でチームを作ると、ここに推移が表示されます。
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <ProgressPicker
        label="チーム"
        name="team"
        value={selected?.id ?? ""}
        options={profiles.map((p) => ({
          value: p.id,
          label: p.name,
          group: CATEGORY_LABEL[p.category],
        }))}
        hrefPrefix="/admin/progress?tab=team&team="
      />
      {selected ? (
        <Card>
          <CardBody>
            <h2 className="text-base font-semibold mb-3">
              {selected.name}（{CATEGORY_LABEL[selected.category]}）
            </h2>
            <TeamProgressView series={await getTeamSeries(selected)} />
          </CardBody>
        </Card>
      ) : (
        <EmptyState>チームを選ぶと団体得点の推移が表示されます。</EmptyState>
      )}
    </div>
  );
}
