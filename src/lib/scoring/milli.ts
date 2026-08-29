/**
 * スコアは numeric(5,3) = 小数第3位まで。
 * 浮動小数点誤差を避けるため、内部計算はすべて「ミリポイント」(値 × 1000 の整数) で行う。
 */

export type Milli = number; // 整数。例: 13.400 -> 13400

/** DB から text で受け取った numeric 文字列 (または null) をミリ整数へ。 */
export function toMilli(value: string | number | null | undefined): Milli | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000);
}

/**
 * ミリ整数を表示用文字列へ。null は "—"。
 * places で小数桁を指定 (既定 3)。D / ND / SB は 1、E・最終・合計は 3 を使う。
 */
export function fromMilli(
  value: Milli | null | undefined,
  places = 3,
): string {
  if (value === null || value === undefined) return "—";
  return (value / 1000).toFixed(places);
}

/** 入力欄プレフィル用: 末尾の不要な 0 を落とす ("13.400" -> "13.4")。 */
export function trimZeros(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return String(n);
}

/** ミリ整数を number(小数第3位) へ。CSV やデバッグ用途。 */
export function milliToNumber(value: Milli | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value / 1000;
}

export function sumMilli(values: Array<Milli | null | undefined>): Milli {
  let acc = 0;
  for (const v of values) if (v !== null && v !== undefined) acc += v;
  return acc;
}
