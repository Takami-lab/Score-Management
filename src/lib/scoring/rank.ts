/**
 * 同点は同順位、次の順位はスキップする (例: 1, 1, 3)。
 * = SQL の rank() 相当 (競技順位)。
 *
 * value が null の要素は「順位対象外」とし rank: null を返す。
 * 呼び出し側でカテゴリ (MAG / WAG) ごとに分割してから使うこと。
 */
export interface Ranked<T> {
  item: T;
  value: number | null;
  rank: number | null;
}

export function rankBy<T>(
  items: T[],
  valueSelector: (item: T) => number | null,
  opts: { unrankedIfNull?: boolean } = { unrankedIfNull: true },
): Ranked<T>[] {
  const withValues = items.map((item) => ({ item, value: valueSelector(item) }));

  const rankable = withValues
    .filter((x) => x.value !== null)
    .sort((a, b) => (b.value as number) - (a.value as number));

  const rankMap = new Map<T, number>();
  let currentRank = 0;
  let seen = 0;
  let prevValue: number | null = null;
  for (const entry of rankable) {
    seen += 1;
    if (prevValue === null || entry.value !== prevValue) {
      currentRank = seen;
      prevValue = entry.value;
    }
    rankMap.set(entry.item, currentRank);
  }

  return withValues.map(({ item, value }) => ({
    item,
    value,
    rank:
      value === null
        ? opts.unrankedIfNull
          ? null
          : null
        : (rankMap.get(item) ?? null),
  }));
}
