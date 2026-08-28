import { notFound } from "next/navigation";
import {
  getCompetition,
  listEntryAthletes,
  listTeams,
  listTeamMembers,
  getTeamRules,
} from "@/lib/db/queries";
import { getCompetitionResults } from "@/lib/db/results";
import { TeamsEditor } from "@/components/teams-editor";
import { ResultsView } from "@/components/results-view";
import { Card, CardBody, CardTitle } from "@/components/ui";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comp = await getCompetition(id);
  if (!comp) notFound();

  const [entries, teams, members, rules, results] = await Promise.all([
    listEntryAthletes(id),
    listTeams(id),
    listTeamMembers(id),
    getTeamRules(),
    getCompetitionResults(id),
  ]);

  const membersByTeam: Record<string, string[]> = {};
  for (const m of members) {
    (membersByTeam[m.team_id] ??= []).push(m.athlete_id);
  }

  return (
    <div className="space-y-6">
      <TeamsEditor
        competitionId={id}
        teams={teams}
        entries={entries}
        membersByTeam={membersByTeam}
        rules={rules}
      />
      {results && teams.length > 0 && (
        <Card>
          <CardBody>
            <CardTitle>団体得点（途中経過）</CardTitle>
            <ResultsView
              results={results.results}
              provisional={results.provisional}
              only="team"
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
