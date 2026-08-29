import "server-only";
import { db } from "@/lib/supabase/server";
import type {
  Apparatus,
  Athlete,
  Category,
  Competition,
  RoutineViewRow,
  Team,
  TeamRuleRow,
} from "@/lib/types";

export async function getCompetition(id: string): Promise<Competition | null> {
  const { data, error } = await db()
    .from("competitions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Competition | null;
}

export async function listCompetitions(): Promise<Competition[]> {
  const { data, error } = await db()
    .from("competitions")
    .select("*")
    .order("held_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Competition[];
}

export async function listActiveAdmins(): Promise<
  { id: string; name: string; is_active: boolean; created_at: string }[]
> {
  const { data, error } = await db()
    .from("admins")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listAllAdmins(): Promise<
  { id: string; name: string; is_active: boolean; created_at: string }[]
> {
  const { data, error } = await db()
    .from("admins")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listApparatuses(): Promise<Apparatus[]> {
  const { data, error } = await db()
    .from("apparatuses")
    .select("*")
    .order("category")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Apparatus[];
}

export async function listActiveAthletes(): Promise<Athlete[]> {
  const { data, error } = await db()
    .from("athletes")
    .select("*")
    .eq("is_active", true)
    .order("kana", { nullsFirst: false })
    .order("last_name");
  if (error) throw error;
  return (data ?? []) as Athlete[];
}

export async function listAllAthletes(): Promise<Athlete[]> {
  const { data, error } = await db()
    .from("athletes")
    .select("*")
    .order("is_active", { ascending: false })
    .order("last_name");
  if (error) throw error;
  return (data ?? []) as Athlete[];
}

export async function getAthlete(id: string): Promise<Athlete | null> {
  const { data, error } = await db()
    .from("athletes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Athlete | null;
}

export async function listEntryAthletes(competitionId: string): Promise<Athlete[]> {
  const { data, error } = await db()
    .from("competition_entries")
    .select("athlete:athletes(*)")
    .eq("competition_id", competitionId);
  if (error) throw error;
  return ((data ?? []) as unknown as { athlete: Athlete }[])
    .map((r) => r.athlete)
    .filter(Boolean)
    .sort((a, b) => (a.kana ?? a.last_name).localeCompare(b.kana ?? b.last_name, "ja"));
}

export async function listAthleteCompetitions(
  athleteId: string,
): Promise<Competition[]> {
  const { data, error } = await db()
    .from("competition_entries")
    .select("competition:competitions!inner(*)")
    .eq("athlete_id", athleteId)
    .neq("competition.status", "draft");
  if (error) throw error;
  return ((data ?? []) as unknown as { competition: Competition }[])
    .map((r) => r.competition)
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.held_on.localeCompare(a.held_on) ||
        b.created_at.localeCompare(a.created_at),
    );
}

export async function isEntered(
  competitionId: string,
  athleteId: string,
): Promise<boolean> {
  const { count, error } = await db()
    .from("competition_entries")
    .select("*", { count: "exact", head: true })
    .eq("competition_id", competitionId)
    .eq("athlete_id", athleteId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function listRoutineRows(
  competitionId: string,
): Promise<RoutineViewRow[]> {
  const { data, error } = await db()
    .from("v_routines")
    .select("*")
    .eq("competition_id", competitionId);
  if (error) throw error;
  return (data ?? []) as RoutineViewRow[];
}

export async function listAthleteRoutineRows(
  competitionId: string,
  athleteId: string,
): Promise<RoutineViewRow[]> {
  const { data, error } = await db()
    .from("v_routines")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("athlete_id", athleteId)
    .order("apparatus_sort_order");
  if (error) throw error;
  return (data ?? []) as RoutineViewRow[];
}

export async function getTeamRules(): Promise<Record<Category, TeamRuleRow>> {
  const { data, error } = await db().from("team_rules").select("*");
  if (error) throw error;
  const map = {} as Record<Category, TeamRuleRow>;
  for (const row of (data ?? []) as TeamRuleRow[]) map[row.category] = row;
  return map;
}

export async function listTeams(competitionId: string): Promise<Team[]> {
  const { data, error } = await db()
    .from("teams")
    .select("*")
    .eq("competition_id", competitionId)
    .order("category")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Team[];
}

export async function listTeamMembers(
  competitionId: string,
): Promise<{ team_id: string; athlete_id: string }[]> {
  const { data, error } = await db()
    .from("team_members")
    .select("team_id, athlete_id, team:teams!inner(competition_id)")
    .eq("team.competition_id", competitionId);
  if (error) throw error;
  return ((data ?? []) as unknown as { team_id: string; athlete_id: string }[]).map(
    (r) => ({ team_id: r.team_id, athlete_id: r.athlete_id }),
  );
}
