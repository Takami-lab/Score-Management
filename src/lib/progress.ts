import type { RoutineViewRow } from "@/lib/types";

export interface AthleteProgress {
  athleteId: string;
  dDone: number;
  eDone: number;
  total: number;
}

/** 選手ごとの D / E 入力進捗を集計する。 */
export function computeProgress(rows: RoutineViewRow[]): Map<string, AthleteProgress> {
  const map = new Map<string, AthleteProgress>();
  for (const r of rows) {
    const p =
      map.get(r.athlete_id) ??
      { athleteId: r.athlete_id, dDone: 0, eDone: 0, total: 0 };
    p.total += 1;
    if (r.d_score !== null) p.dDone += 1;
    if (r.e_score !== null) p.eDone += 1;
    map.set(r.athlete_id, p);
  }
  return map;
}
