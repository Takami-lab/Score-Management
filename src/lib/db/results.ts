import "server-only";
import {
  getCompetition,
  listApparatuses,
  listEntryAthletes,
  listRoutineRows,
  listTeams,
  listTeamMembers,
  getTeamRules,
} from "@/lib/db/queries";
import { aggregateAll, type CategoryResults } from "@/lib/aggregate";
import type { Category, Competition } from "@/lib/types";

export interface CompetitionResults {
  competition: Competition;
  provisional: boolean; // finalized 以外は暫定
  results: Record<Category, CategoryResults>;
}

export async function getCompetitionResults(
  competitionId: string,
): Promise<CompetitionResults | null> {
  const competition = await getCompetition(competitionId);
  if (!competition) return null;

  const [athletes, apparatuses, routineRows, teams, teamMembers, rules] =
    await Promise.all([
      listEntryAthletes(competitionId),
      listApparatuses(),
      listRoutineRows(competitionId),
      listTeams(competitionId),
      listTeamMembers(competitionId),
      getTeamRules(),
    ]);

  const results = aggregateAll({
    athletes,
    apparatuses,
    routineRows,
    teams,
    teamMembers,
    rules,
  });

  return {
    competition,
    provisional: competition.status !== "finalized",
    results,
  };
}
