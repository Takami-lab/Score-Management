import type { Milli } from "./milli";

export interface RoutineScoreInput {
  d: Milli | null;
  e: Milli | null;
  nd: Milli | null; // 常に正値で保存され、計算時に減算する
  sb: Milli | null; // 0 または 100 (0.1)
}

/**
 * 種目最終スコア = D + E − ND + SB
 * D または E が null の場合は「未確定」として null を返す。
 * ND / SB の未設定は 0 として扱う。
 */
export function finalScore(input: RoutineScoreInput): Milli | null {
  if (input.d === null || input.e === null) return null;
  const nd = input.nd ?? 0;
  const sb = input.sb ?? 0;
  return input.d + input.e - nd + sb;
}

/** 最終スコアが確定しているか (= 合計・順位計算に含めてよいか)。 */
export function isConfirmed(input: RoutineScoreInput): boolean {
  return input.d !== null && input.e !== null;
}
