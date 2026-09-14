import { redirect } from "next/navigation";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { getAthleteSeries } from "@/lib/db/series";
import { AthleteProgressView } from "@/components/athlete-progress-view";
import { Card, CardBody } from "@/components/ui";
import { athleteLabel } from "@/lib/types";

export default async function AthleteProgressPage() {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/athlete/login");
  const series = await getAthleteSeries(athlete);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">得点推移</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {athleteLabel(athlete)} ・ 確定済みの試技会のみ
        </p>
      </div>
      <Card>
        <CardBody>
          <AthleteProgressView series={series} />
        </CardBody>
      </Card>
    </div>
  );
}
