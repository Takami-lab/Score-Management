import { describe, it, expect } from "vitest";
import { toMilli, fromMilli, sumMilli, trimZeros } from "./milli";
import { finalScore, isConfirmed } from "./finalScore";
import { allAround } from "./allAround";
import { teamScore } from "./teamScore";
import { rankBy } from "./rank";

describe("milli", () => {
  it("小数第3位を誤差なく整数化する", () => {
    expect(toMilli("13.400")).toBe(13400);
    expect(toMilli("5.9")).toBe(5900);
    expect(toMilli("0.1")).toBe(100);
    expect(toMilli(null)).toBeNull();
    expect(toMilli("")).toBeNull();
  });
  it("表示は常に小数第3位", () => {
    expect(fromMilli(13400)).toBe("13.400");
    expect(fromMilli(100)).toBe("0.100");
    expect(fromMilli(0)).toBe("0.000");
    expect(fromMilli(null)).toBe("—");
    expect(fromMilli(-300)).toBe("-0.300");
  });
  it("0.1 + 0.2 の加算で誤差が出ない", () => {
    expect(sumMilli([toMilli("0.1"), toMilli("0.2")])).toBe(300);
    expect(fromMilli(sumMilli([toMilli("0.1"), toMilli("0.2")]))).toBe("0.300");
  });
  it("places 指定で桁数を変えられる (D/ND/SB は 1、E・最終は 3)", () => {
    expect(fromMilli(13400, 1)).toBe("13.4");
    expect(fromMilli(100, 1)).toBe("0.1");
    expect(fromMilli(13950, 3)).toBe("13.950");
    expect(fromMilli(null, 1)).toBe("—");
  });
  it("trimZeros: 入力欄プレフィル用に末尾0を落とす", () => {
    expect(trimZeros("13.400")).toBe("13.4");
    expect(trimZeros("0.300")).toBe("0.3");
    expect(trimZeros("")).toBe("");
    expect(trimZeros(null)).toBe("");
    expect(trimZeros("14.000")).toBe("14");
  });
});

describe("finalScore = D + E - ND + SB", () => {
  it("通常計算", () => {
    expect(
      finalScore({ d: toMilli("5.600"), e: toMilli("8.400"), nd: 0, sb: 0 }),
    ).toBe(14000);
  });
  it("ND を減算し SB を加算する", () => {
    expect(
      finalScore({
        d: toMilli("5.000"),
        e: toMilli("8.000"),
        nd: toMilli("0.300"),
        sb: toMilli("0.100"),
      }),
    ).toBe(12800);
  });
  it("D が未入力なら未確定 (null)", () => {
    expect(finalScore({ d: null, e: toMilli("8.000"), nd: 0, sb: 0 })).toBeNull();
  });
  it("E が未入力なら未確定 (null)", () => {
    expect(finalScore({ d: toMilli("5.000"), e: null, nd: 0, sb: 0 })).toBeNull();
    expect(isConfirmed({ d: toMilli("5.0"), e: null, nd: 0, sb: 0 })).toBe(false);
  });
});

describe("個人総合: 未入力の種目が混在", () => {
  it("確定した種目だけ合計し、種目数を併記する (4/6)", () => {
    const finals = [
      toMilli("13.400"),
      toMilli("12.800"),
      null, // つり輪 未実施
      toMilli("14.000"),
      null, // 平行棒 E 未入力
      toMilli("13.100"),
    ];
    const r = allAround(finals, 6);
    expect(r.confirmedCount).toBe(4);
    expect(r.totalApparatus).toBe(6);
    expect(fromMilli(r.total)).toBe("53.300");
  });
  it("1種目も確定していない選手も対象 (total 0, 0/6)", () => {
    const r = allAround([null, null, null, null, null, null], 6);
    expect(r.total).toBe(0);
    expect(r.confirmedCount).toBe(0);
  });
});

describe("団体スコア", () => {
  const MAG = { teamSize: 6, countingCount: 5 };
  const WAG = { teamSize: 4, countingCount: 3 };

  it("MAG 6-6-5: 各種目 上位5名を採用", () => {
    // 1種目だけ、6名全員確定
    const finals = [
      toMilli("14.000"),
      toMilli("13.500"),
      toMilli("13.000"),
      toMilli("12.500"),
      toMilli("12.000"),
      toMilli("11.000"), // ← 最下位、カットされる
    ];
    const r = teamScore([{ apparatusId: 1, finals }], MAG);
    expect(r.perApparatus[0].confirmedCount).toBe(6);
    // 14 + 13.5 + 13 + 12.5 + 12 = 65.000
    expect(fromMilli(r.perApparatus[0].score)).toBe("65.000");
    expect(fromMilli(r.total)).toBe("65.000");
  });

  it("WAG 4-4-3: 各種目 上位3名を採用", () => {
    const finals = [
      toMilli("13.000"),
      toMilli("12.000"),
      toMilli("11.000"),
      toMilli("10.000"), // カット
    ];
    const r = teamScore([{ apparatusId: 1, finals }], WAG);
    expect(fromMilli(r.perApparatus[0].score)).toBe("36.000");
  });

  it("確定人数が採用人数に満たない場合も入力済みの分だけ集計 (3/5名)", () => {
    const finals = [
      toMilli("14.000"),
      toMilli("13.000"),
      toMilli("12.000"),
      null,
      null,
      null,
    ];
    const r = teamScore([{ apparatusId: 1, finals }], MAG);
    expect(r.perApparatus[0].confirmedCount).toBe(3);
    expect(r.perApparatus[0].countingCount).toBe(5);
    expect(fromMilli(r.perApparatus[0].score)).toBe("39.000");
  });

  it("複数種目の合計 = 総得点", () => {
    const r = teamScore(
      [
        { apparatusId: 1, finals: [toMilli("10.000"), toMilli("9.000"), toMilli("8.000")] },
        { apparatusId: 2, finals: [toMilli("11.000"), toMilli("10.000"), toMilli("9.000")] },
      ],
      WAG,
    );
    expect(fromMilli(r.total)).toBe("57.000");
  });
});

describe("順位: 同点は同順位、次はスキップ (1, 1, 3)", () => {
  it("個人総合の同点", () => {
    const items = [
      { id: "a", score: 53300 },
      { id: "b", score: 53300 },
      { id: "c", score: 52000 },
      { id: "d", score: 50000 },
    ];
    const ranked = rankBy(items, (x) => x.score);
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3, 4]);
  });
  it("3人同点なら 1,1,1,4", () => {
    const items = [{ v: 10 }, { v: 10 }, { v: 10 }, { v: 5 }];
    expect(rankBy(items, (x) => x.v).map((r) => r.rank)).toEqual([1, 1, 1, 4]);
  });
  it("未確定 (null) は順位対象外", () => {
    const items = [{ v: 10 }, { v: null as number | null }, { v: 8 }];
    const ranked = rankBy(items, (x) => x.v);
    expect(ranked.map((r) => r.rank)).toEqual([1, null, 2]);
  });
  it("入力順に依らず安定して順位付けする", () => {
    const items = [{ v: 5 }, { v: 20 }, { v: 12 }, { v: 20 }];
    expect(rankBy(items, (x) => x.v).map((r) => r.rank)).toEqual([4, 1, 3, 1]);
  });
});
