/** タイムゾーンは Asia/Tokyo 固定。 */
export const TZ = "Asia/Tokyo";

/** JST の「今日」を YYYY-MM-DD で返す。 */
export function todayJst(): string {
  return formatDateJst(new Date());
}

/** Date を JST の YYYY-MM-DD へ。 */
export function formatDateJst(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // en-CA は YYYY-MM-DD
}

/** timestamptz を JST の "YYYY-MM-DD HH:mm" へ。 */
export function formatDateTimeJst(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const s = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return s;
}

/** 年月 (0-indexed month) の日付グリッド用に、その月の日数と初日の曜日を返す。 */
export function monthGrid(year: number, month0: number) {
  const first = new Date(Date.UTC(year, month0, 1));
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const startWeekday = first.getUTCDay(); // 0=日
  return { daysInMonth, startWeekday };
}
