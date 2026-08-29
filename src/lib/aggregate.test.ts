import { describe, it, expect } from "vitest";
import { aggregateCategory, type AggregateInput } from "@/lib/aggregate";
import { fromMilli } from "@/lib/scoring/milli";
import type { Apparatus, Athlete, RoutineViewRow, Team, TeamRuleRow } from "@/lib/types";

const MAG_APP: Apparatus[] = ["FX", "PH", "SR", "VT", "PB", "HB"].map((code, i) => ({
  id: i + 1,
  code,
  name_ja: code,
  category: "MAG",
  sort_order: i + 1,
}));

function athlete(id: string, last: string): Athlete {
  return {
    id,
    last_name: last,
    first_name: "太郎",
    kana: last,
    category: "MAG",
    affiliation: null,
    birth_mmdd: null,
    is_active: true,
    created_at: "",
  };
}

function row(
  athleteId: string,
  apparatusId: number,
  d: string | null,
  e: string | null,
): RoutineViewRow {
  const ap = MAG_APP.find((a) => a.id === apparatusId)!;
  return {
    id: `${athleteId}-${apparatusId}`,
    competition_id: "c1",
    athlete_id: athleteId,
    apparatus_id: apparatusId,
    apparatus_code: ap.code,
    apparatus_name: ap.name_ja,
    category: "MAG",
    apparatus_sort_order: ap.sort_order,
    d_score: d,
    e_score: e,
    nd: "0",
    sb: "0",
    d_updated_at: null,
    e_updated_at: null,
  };
}

const rules: Record<"MAG" | "WAG", TeamRuleRow> = {
  MAG: { category: "MAG", team_size: 6, counting_count: 5 },
  WAG: { category: "WAG", team_size: 4, counting_count: 3 },
};

describe("aggregateCategory: 個人総合 + 順位", () => {
  const athletes = [athlete("a", "青木"), athlete("b", "石田"), athlete("c", "上田")];

  // a: 6種目すべて 13.000 -> 78.000
  // b: 6種目すべて 13.000 -> 78.000 (a と同点)
  // c: 4種目のみ 13.000 -> 52.000 (2種目は E 未入力)
  const rows: RoutineViewRow[] = [
    ...MAG_APP.map((ap) => row("a", ap.id, "5.000", "8.000")),
    ...MAG_APP.map((ap) => row("b", ap.id, "5.000", "8.000")),
    ...MAG_APP.slice(0, 4).map((ap) => row("c", ap.id, "5.000", "8.000")),
    ...MAG_APP.slice(4).map((ap) => row("c", ap.id, "5.000", null)),
  ];

  const input: AggregateInput = {
    athletes,
    apparatuses: MAG_APP,
    routineRows: rows,
    teams: [],
    teamMembers: [],
    rules,
  };

  it("確定種目のみ合計し、未出場選手もランキングに含む", () => {
    const r = aggregateCategory("MAG", input);
    const byId = Object.fromEntries(r.allAround.map((x) => [x.athlete.id, x]));
    expect(fromMilli(byId.a.total)).toBe("78.000");
    expect(byId.c.confirmedCount).toBe(4);
    expect(byId.c.totalApparatus).toBe(6);
    expect(fromMilli(byId.c.total)).toBe("52.000");
  });

  it("同点は同順位・次はスキップ (1,1,3)", () => {
    const r = aggregateCategory("MAG", input);
    const ranks = r.allAround.map((x) => x.rank);
    expect(ranks).toEqual([1, 1, 3]);
  });
});

describe("aggregateCategory: 団体 (MAG 6-6-5, 確定人数不足)", () => {
  const ids = ["m1", "m2", "m3", "m4", "m5", "m6"];
  const athletes = ids.map((id, i) => athlete(id, `選手${i}`));
  const team: Team = { id: "t1", competition_id: "c1", name: "A校", category: "MAG" };

  // FX(id=1): 6名確定 14,13,12,11,10,9 -> 上位5 = 60.000
  // PH(id=2): 3名のみ確定 10,9,8 -> 27.000 (3/5名)
  // 他種目は未確定
  const scores = [14, 13, 12, 11, 10, 9];
  const rows: RoutineViewRow[] = [
    ...ids.map((id, i) => row(id, 1, "6.000", String(scores[i] - 6))),
    ...ids.slice(0, 3).map((id, i) => row(id, 2, "4.000", String([6, 5, 4][i]))),
  ];

  const input: AggregateInput = {
    athletes,
    apparatuses: MAG_APP,
    routineRows: rows,
    teams: [team],
    teamMembers: ids.map((athlete_id) => ({ team_id: "t1", athlete_id })),
    rules,
  };

  it("各種目 上位5名合計・不足種目は入力済み分のみ", () => {
    const r = aggregateCategory("MAG", input);
    const t = r.teams[0];
    const fx = t.perApparatus.find((p) => p.apparatus.id === 1)!;
    const ph = t.perApparatus.find((p) => p.apparatus.id === 2)!;
    expect(fromMilli(fx.score)).toBe("60.000");
    expect(fx.confirmedCount).toBe(6);
    expect(fromMilli(ph.score)).toBe("27.000");
    expect(ph.confirmedCount).toBe(3);
    expect(ph.countingCount).toBe(5);
    expect(fromMilli(t.total)).toBe("87.000");
  });

  it("メンバー×種目の内訳: 上位5に入らない得点は counted=false", () => {
    const r = aggregateCategory("MAG", input);
    const t = r.teams[0];
    expect(t.members).toHaveLength(6);
    // FX: m6 (9.000) が6人中最下位 → 採用外
    const m6 = t.members.find((m) => m.athlete.id === "m6")!;
    const m6fx = m6.cells.find((c) => c.apparatusId === 1)!;
    expect(fromMilli(m6fx.final)).toBe("9.000");
    expect(m6fx.counted).toBe(false);
    // FX: m1 (14.000) は採用
    const m1fx = t.members
      .find((m) => m.athlete.id === "m1")!
      .cells.find((c) => c.apparatusId === 1)!;
    expect(m1fx.counted).toBe(true);
    // PH: m4 は未入力 → final null, counted false
    const m4ph = t.members
      .find((m) => m.athlete.id === "m4")!
      .cells.find((c) => c.apparatusId === 2)!;
    expect(m4ph.final).toBeNull();
    expect(m4ph.counted).toBe(false);
    // 採用された FX の得点合計 = チーム得点
    const countedFx = t.members
      .map((m) => m.cells.find((c) => c.apparatusId === 1)!)
      .filter((c) => c.counted)
      .reduce((s, c) => s + (c.final ?? 0), 0);
    expect(countedFx).toBe(
      t.perApparatus.find((p) => p.apparatus.id === 1)!.score,
    );
  });
});
