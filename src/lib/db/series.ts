import "server-only";
import { db } from "@/lib/supabase/server";
import { listApparatuses, getTeamRules } from "@/lib/db/queries";
import { toMilli, type Milli } from "@/lib/scoring/milli";
import { finalScore } from "@/lib/scoring/finalScore";
import { teamScore } from "@/lib/scoring/teamScore";
import type {
  Apparatus,
  Athlete,
  Category,
  Competition,
  RoutineViewRow,
  TeamProfile,
} from "@/lib/types";

/** 推移グラフは「確定 (finalized)」の試技会だけを対象にする。 */
const TARGET_STATUS = "finalized";

export interface SeriesCompetition {
  id: string;
  name: string;
  held_on: string;
}

export interface AthleteApparatusPoint {
  apparatusId: number;
  d: Milli | null;
  e: Milli | null;
  nd: Milli;
  sb: Milli;
  final: Milli | null;
}

export interface AthleteSeriesPoint {
  competition: SeriesCompetition;
  /** 確定した種目の合計 */
  allAroundTotal: Milli;
  confirmedCount: number;
  totalApparatus: number;
  /** 全種目そろっているか (個人総合の横並び比較が成立するか) */
  complete: boolean;
  perApparatus: AthleteApparatusPoint[];
}

export interface AthleteSeries {
  athlete: Athlete;
  apparatuses: Apparatus[];
  points: AthleteSeriesPoint[];
}

async function listFinalizedCompetitions(): Promise<Competition[]> {
  const { data, error } = await db()
    .from("competitions")
    .select("*")
    .eq("status", TARGET_STATUS)
    .order("held_on");
  if (error) throw error;
  return (data ?? []) as Competition[];
}

async function listRoutineRowsForAthlete(
  athleteId: string,
): Promise<RoutineViewRow[]> {
  const { data, error } = await db()
    .from("v_routines")
    .select("*")
    .eq("athlete_id", athleteId);
  if (error) throw error;
  return (data ?? []) as RoutineViewRow[];
}

/** 1 選手の、確定済み試技会にわたる得点推移。 */
export async function getAthleteSeries(
  athlete: Athlete,
): Promise<AthleteSeries> {
  const [competitions, apparatusesAll, rows] = await Promise.all([
    listFinalizedCompetitions(),
    listApparatuses(),
    listRoutineRowsForAthlete(athlete.id),
  ]);

  const apparatuses = apparatusesAll
    .filter((a) => a.category === athlete.category)
    .sort((a, b) => a.sort_order - b.sort_order);

  const byCompetition = new Map<string, Map<number, RoutineViewRow>>();
  for (const r of rows) {
    if (!byCompetition.has(r.competition_id))
      byCompetition.set(r.competition_id, new Map());
    byCompetition.get(r.competition_id)!.set(r.apparatus_id, r);
  }

  const points: AthleteSeriesPoint[] = [];
  for (const c of competitions) {
    const cells = byCompetition.get(c.id);
    if (!cells) continue; // その試技会に出場していない

    const perApparatus: AthleteApparatusPoint[] = apparatuses.map((ap) => {
      const r = cells.get(ap.id);
      const d = toMilli(r?.d_score ?? null);
      const e = toMilli(r?.e_score ?? null);
      const nd = toMilli(r?.nd ?? null) ?? 0;
      const sb = toMilli(r?.sb ?? null) ?? 0;
      return { apparatusId: ap.id, d, e, nd, sb, final: finalScore({ d, e, nd, sb }) };
    });

    const confirmed = perApparatus.filter((p) => p.final !== null);
    if (confirmed.length === 0) continue; // 1種目も確定していない試技会は点にしない

    points.push({
      competition: { id: c.id, name: c.name, held_on: c.held_on },
      allAroundTotal: confirmed.reduce((s, p) => s + (p.final as number), 0),
      confirmedCount: confirmed.length,
      totalApparatus: apparatuses.length,
      complete: confirmed.length === apparatuses.length,
      perApparatus,
    });
  }

  return { athlete, apparatuses, points };
}

/* ── 団体 ─────────────────────────────────────────────── */

export interface TeamSeriesPoint {
  competition: SeriesCompetition;
  total: Milli;
  perApparatus: { apparatusId: number; score: Milli; confirmedCount: number }[];
  countingCount: number;
  memberCount: number;
  /** 全種目で採用人数ぶん確定しているか */
  complete: boolean;
}

export interface TeamSeries {
  profile: TeamProfile;
  apparatuses: Apparatus[];
  points: TeamSeriesPoint[];
}

/** 1 チーム (台帳) の、確定済み試技会にわたる団体得点推移。 */
export async function getTeamSeries(profile: TeamProfile): Promise<TeamSeries> {
  const [competitions, apparatusesAll, rules] = await Promise.all([
    listFinalizedCompetitions(),
    listApparatuses(),
    getTeamRules(),
  ]);

  const apparatuses = apparatusesAll
    .filter((a) => a.category === profile.category)
    .sort((a, b) => a.sort_order - b.sort_order);
  const rule = rules[profile.category as Category];
  const countingCount = rule?.counting_count ?? apparatuses.length;

  // この台帳に紐付く、確定済み試技会のチーム
  const finalizedIds = new Set(competitions.map((c) => c.id));
  const { data: teamRows, error: teamErr } = await db()
    .from("teams")
    .select("id, competition_id")
    .eq("team_profile_id", profile.id);
  if (teamErr) throw teamErr;
  const teams = (teamRows ?? []).filter((t) =>
    finalizedIds.has(t.competition_id as string),
  ) as { id: string; competition_id: string }[];
  if (teams.length === 0) return { profile, apparatuses, points: [] };

  const { data: memberRows, error: memErr } = await db()
    .from("team_members")
    .select("team_id, athlete_id")
    .in(
      "team_id",
      teams.map((t) => t.id),
    );
  if (memErr) throw memErr;
  const membersByTeam = new Map<string, string[]>();
  for (const m of (memberRows ?? []) as { team_id: string; athlete_id: string }[]) {
    if (!membersByTeam.has(m.team_id)) membersByTeam.set(m.team_id, []);
    membersByTeam.get(m.team_id)!.push(m.athlete_id);
  }

  const { data: routineRows, error: rtErr } = await db()
    .from("v_routines")
    .select("*")
    .in(
      "competition_id",
      teams.map((t) => t.competition_id),
    );
  if (rtErr) throw rtErr;
  const finalByCompAthleteAp = new Map<string, Milli | null>();
  for (const r of (routineRows ?? []) as RoutineViewRow[]) {
    const d = toMilli(r.d_score);
    const e = toMilli(r.e_score);
    const nd = toMilli(r.nd) ?? 0;
    const sb = toMilli(r.sb) ?? 0;
    finalByCompAthleteAp.set(
      `${r.competition_id}|${r.athlete_id}|${r.apparatus_id}`,
      finalScore({ d, e, nd, sb }),
    );
  }

  const teamByCompetition = new Map(teams.map((t) => [t.competition_id, t]));
  const points: TeamSeriesPoint[] = [];
  for (const c of competitions) {
    const t = teamByCompetition.get(c.id);
    if (!t) continue;
    const memberIds = membersByTeam.get(t.id) ?? [];
    if (memberIds.length === 0) continue;

    const apparatusFinals = apparatuses.map((ap) => ({
      apparatusId: ap.id,
      finals: memberIds.map(
        (aid) => finalByCompAthleteAp.get(`${c.id}|${aid}|${ap.id}`) ?? null,
      ),
    }));
    const ts = teamScore(apparatusFinals, {
      teamSize: rule?.team_size ?? memberIds.length,
      countingCount,
    });
    const anyScore = ts.perApparatus.some((p) => p.confirmedCount > 0);
    if (!anyScore) continue;

    points.push({
      competition: { id: c.id, name: c.name, held_on: c.held_on },
      total: ts.total,
      perApparatus: ts.perApparatus.map((p) => ({
        apparatusId: p.apparatusId,
        score: p.score,
        confirmedCount: p.confirmedCount,
      })),
      countingCount,
      memberCount: memberIds.length,
      complete: ts.perApparatus.every((p) => p.confirmedCount >= countingCount),
    });
  }

  return { profile, apparatuses, points };
}
