import { redirect, notFound } from "next/navigation";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { getCompetitionResults } from "@/lib/db/results";
import { ResultsView } from "@/components/results-view";
import { Card, CardBody } from "@/components/ui";

export default async function AthleteResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/athlete/login");
  const data = await getCompetitionResults(id);
  if (!data) notFound();

  return (
    <Card>
      <CardBody>
        <div className="flex justify-end mb-3">
          <a
            href={`/api/csv/${id}`}
            className="inline-flex items-center min-h-11 px-4 rounded-md border border-[var(--color-border)] text-sm hover:bg-[var(--color-accent)]"
          >
            CSV エクスポート
          </a>
        </div>
        <ResultsView
          results={data.results}
          provisional={data.provisional}
          highlightAthleteId={athlete.id}
          defaultCategory={athlete.category}
        />
      </CardBody>
    </Card>
  );
}
