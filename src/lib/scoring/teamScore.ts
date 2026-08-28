import type { Milli } from "./milli";
import { sumMilli } from "./milli";

export interface TeamRule {
  teamSize: number; // 団体の登録人数 (MAG:6 / WAG:4)
  countingCount: number; // 各種目で採用する上位人数 (MAG:5 / WAG:3)
}

export interface TeamApparatusScore {
  apparatusId: number;
  score: Milli; // 上位 countingCount 名の合計 (不足時は入力済みの分だけ)
  confirmedCount: number; // その種目で最終スコアが確定しているメンバー数
  countingCount: number; // rule.countingCount (バッジ表示 "3/5名" 用)
}

export interface TeamScoreResult {
  perApparatus: TeamApparatusScore[];
  total: Milli; // 全種目のチーム得点の合計
}

/**
 * 団体スコア。
 * 種目ごと: メンバーのうち最終スコアが確定している者を降順に並べ、上位 countingCount 名を合計。
 * 確定人数が countingCount に満たない場合も、入力済みの分だけで集計する (途中経過)。
 *
 * @param apparatusFinals apparatusId -> そのチームメンバーの最終スコア配列 (未確定は null)
 * @param rule team_rules から取得した値 (ハードコード禁止)
 */
export function teamScore(
  apparatusFinals: Array<{ apparatusId: number; finals: Array<Milli | null> }>,
  rule: TeamRule,
): TeamScoreResult {
  const perApparatus: TeamApparatusScore[] = apparatusFinals.map(
    ({ apparatusId, finals }) => {
      const confirmed = finals
        .filter((f): f is Milli => f !== null)
        .sort((a, b) => b - a);
      const counted = confirmed.slice(0, rule.countingCount);
      return {
        apparatusId,
        score: sumMilli(counted),
        confirmedCount: confirmed.length,
        countingCount: rule.countingCount,
      };
    },
  );

  return {
    perApparatus,
    total: sumMilli(perApparatus.map((a) => a.score)),
  };
}
