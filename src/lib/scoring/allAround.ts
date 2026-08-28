import type { Milli } from "./milli";
import { sumMilli } from "./milli";

export interface AllAroundResult {
  total: Milli; // 確定している種目の最終スコア合計
  confirmedCount: number; // 確定した種目数
  totalApparatus: number; // そのカテゴリの種目総数 (例: 6)
}

/**
 * 個人総合 = その試技会で最終スコアが確定している全種目の合計。
 * 全種目に出場していない選手も対象 (confirmedCount / totalApparatus を併記する)。
 *
 * @param finals 各種目の最終スコア (未確定は null)
 * @param totalApparatus カテゴリの種目総数
 */
export function allAround(
  finals: Array<Milli | null>,
  totalApparatus: number,
): AllAroundResult {
  const confirmed = finals.filter((f): f is Milli => f !== null);
  return {
    total: sumMilli(confirmed),
    confirmedCount: confirmed.length,
    totalApparatus,
  };
}
