import type {
  Apparatus,
  Athlete,
  Category,
  RoutineViewRow,
  Team,
  TeamRuleRow,
} from "@/lib/types";
import { toMilli, type Milli } from "@/lib/scoring/milli";
import { finalScore } from "@/lib/scoring/finalScore";
import { allAround } from "@/lib/scoring/allAround";
import { teamScore } from "@/lib/scoring/teamScore";
import { rankBy } from "@/lib/scoring/rank";

export interface RoutineCell {
  apparatusId: number;
  code: string;
  name: string;
  sortOrder: number;
  d: Milli | null;
  e: Milli | null;
  nd: Milli;
  sb: Milli;
  final: Milli | null;
  dUpdatedAt: string | null;
  eUpdatedAt: string | null;
}

export interface AllAroundRow {
  athlete: Athlete;
  cells: RoutineCell[];
  total: Milli;
  confirmedCount: number;
  totalApparatus: number;
  rank: number | null;
}

export interface ApparatusRankingRow {
  athlete: Athlete;
  final: Milli;
  rank: number;
}
export interface ApparatusRanking {
  apparatus: Apparatus;
  rows: ApparatusRankingRow[];
}

export interface TeamApparatusStanding {
  apparatus: Apparatus;
  score: Milli;
  confirmedCount: number;
  countingCount: number;
}
export interface TeamStanding {
  team: Team;
  perApparatus: TeamApparatusStanding[];
  total: Milli;
  rank: number | null;
  teamSize: number;
  memberCount: number;
}

export interface CategoryResults {
  category: Category;
  allAround: AllAroundRow[];
  apparatusRankings: ApparatusRanking[];
  teams: TeamStanding[];
}

function cellFromRow(row: RoutineViewRow): RoutineCell {
  const d = toMilli(row.d_score);
  const e = toMilli(row.e_score);
  const nd = toMilli(row.nd) ?? 0;
  const sb = toMilli(row.sb) ?? 0;
  return {
    apparatusId: row.apparatus_id,
    code: row.apparatus_code,
    name: row.apparatus_name,
    sortOrder: row.apparatus_sort_order,
    d,
    e,
    nd,
    sb,
    final: finalScore({ d, e, nd, sb }),
    dUpdatedAt: row.d_updated_at,
    eUpdatedAt: row.e_updated_at,
  };
}

export interface AggregateInput {
  athletes: Athlete[]; // エントリー選手
  apparatuses: Apparatus[];
  routineRows: RoutineViewRow[];
  teams: Team[];
  teamMembers: { team_id: string; athlete_id: string }[];
  rules: Record<Category, TeamRuleRow>;
}

export function aggregateCategory(
  category: Category,
  input: AggregateInput,
): CategoryResults {
  const apparatuses = input.apparatuses
    .filter((a) => a.category === category)
    .sort((a, b) => a.sort_order - b.sort_order);
  const athletes = input.athletes.filter((a) => a.category === category);
  const rowsByAthlete = new Map<string, Map<number, RoutineCell>>();
  for (const row of input.routineRows) {
    if (row.category !== category) continue;
    if (!rowsByAthlete.has(row.athlete_id))
      rowsByAthlete.set(row.athlete_id, new Map());
    rowsByAthlete.get(row.athlete_id)!.set(row.apparatus_id, cellFromRow(row));
  }

  // 個人総合
  const aaBase = athletes.map((athlete) => {
    const cellMap = rowsByAthlete.get(athlete.id) ?? new Map<number, RoutineCell>();
    const cells = apparatuses.map(
      (ap): RoutineCell =>
        cellMap.get(ap.id) ?? {
          apparatusId: ap.id,
          code: ap.code,
          name: ap.name_ja,
          sortOrder: ap.sort_order,
          d: null,
          e: null,
          nd: 0,
          sb: 0,
          final: null,
          dUpdatedAt: null,
          eUpdatedAt: null,
        },
    );
    const aa = allAround(
      cells.map((c) => c.final),
      apparatuses.length,
    );
    return { athlete, cells, ...aa };
  });
  const aaRanked = rankBy(aaBase, (x) =>
    x.confirmedCount > 0 ? x.total : null,
  );
  const allAroundRows: AllAroundRow[] = aaBase
    .map((base, i) => ({ ...base, rank: aaRanked[i].rank }))
    .sort((a, b) => {
      if (a.rank === null && b.rank === null)
        return a.athlete.last_name.localeCompare(b.athlete.last_name, "ja");
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank;
    });

  // 種目別順位
  const apparatusRankings: ApparatusRanking[] = apparatuses.map((ap) => {
    const entries = athletes
      .map((athlete) => {
        const cell = rowsByAthlete.get(athlete.id)?.get(ap.id);
        return { athlete, final: cell?.final ?? null };
      })
      .filter((x): x is { athlete: Athlete; final: Milli } => x.final !== null);
    const ranked = rankBy(entries, (x) => x.final);
    return {
      apparatus: ap,
      rows: ranked
        .map((r) => ({
          athlete: r.item.athlete,
          final: r.item.final,
          rank: r.rank as number,
        }))
        .sort((a, b) => a.rank - b.rank),
    };
  });

  // 団体
  const rule = input.rules[category];
  const catTeams = input.teams.filter((t) => t.category === category);
  const membersByTeam = new Map<string, string[]>();
  for (const m of input.teamMembers) {
    if (!membersByTeam.has(m.team_id)) membersByTeam.set(m.team_id, []);
    membersByTeam.get(m.team_id)!.push(m.athlete_id);
  }
  const teamBase = catTeams.map((team) => {
    const memberIds = membersByTeam.get(team.id) ?? [];
    const apparatusFinals = apparatuses.map((ap) => ({
      apparatusId: ap.id,
      finals: memberIds.map(
        (aid) => rowsByAthlete.get(aid)?.get(ap.id)?.final ?? null,
      ),
    }));
    const ts = rule
      ? teamScore(apparatusFinals, {
          teamSize: rule.team_size,
          countingCount: rule.counting_count,
        })
      : { perApparatus: [], total: 0 };
    const perApparatus: TeamApparatusStanding[] = apparatuses.map((ap, i) => ({
      apparatus: ap,
      score: ts.perApparatus[i]?.score ?? 0,
      confirmedCount: ts.perApparatus[i]?.confirmedCount ?? 0,
      countingCount: rule?.counting_count ?? 0,
    }));
    return {
      team,
      perApparatus,
      total: ts.total,
      teamSize: rule?.team_size ?? 0,
      memberCount: memberIds.length,
    };
  });
  const teamRanked = rankBy(teamBase, (x) => (x.total > 0 ? x.total : null));
  const teams: TeamStanding[] = teamBase
    .map((base, i) => ({ ...base, rank: teamRanked[i].rank }))
    .sort((a, b) => {
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank;
    });

  return { category, allAround: allAroundRows, apparatusRankings, teams };
}

export function aggregateAll(input: AggregateInput): Record<Category, CategoryResults> {
  return {
    MAG: aggregateCategory("MAG", input),
    WAG: aggregateCategory("WAG", input),
  };
}
