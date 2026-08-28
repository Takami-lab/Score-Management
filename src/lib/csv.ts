import { fromMilli } from "@/lib/scoring/milli";
import { CATEGORY_LABEL, type Category } from "@/lib/types";
import type { CategoryResults } from "@/lib/aggregate";

const BOM = "﻿";

function escapeCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return BOM + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}

/** 個人総合 + 種目別内訳 + 団体を 1 ファイルにまとめる。管理者・選手 同一内容。 */
export function buildResultsCsv(
  competitionName: string,
  heldOn: string,
  provisional: boolean,
  results: Record<Category, CategoryResults>,
): string {
  const rows: (string | number)[][] = [];
  rows.push([`試技会`, competitionName, heldOn, provisional ? "暫定" : "確定"]);
  rows.push([]);

  for (const cat of ["MAG", "WAG"] as Category[]) {
    const r = results[cat];
    const apparatus = r.apparatusRankings.map((a) => a.apparatus);

    rows.push([`【${CATEGORY_LABEL[cat]}】個人総合`]);
    rows.push([
      "順位",
      "選手",
      "所属",
      "確定種目数",
      ...apparatus.map((a) => a.name_ja),
      "個人総合",
    ]);
    for (const row of r.allAround) {
      rows.push([
        row.rank ?? "",
        `${row.athlete.last_name} ${row.athlete.first_name}`,
        row.athlete.affiliation ?? "",
        `${row.confirmedCount}/${row.totalApparatus}`,
        ...row.cells.map((c) => (c.final === null ? "" : fromMilli(c.final))),
        fromMilli(row.total),
      ]);
    }
    rows.push([]);

    rows.push([`【${CATEGORY_LABEL[cat]}】種目別順位`]);
    for (const ar of r.apparatusRankings) {
      rows.push([ar.apparatus.name_ja]);
      rows.push(["順位", "選手", "所属", "最終"]);
      for (const x of ar.rows) {
        rows.push([
          x.rank,
          `${x.athlete.last_name} ${x.athlete.first_name}`,
          x.athlete.affiliation ?? "",
          fromMilli(x.final),
        ]);
      }
      rows.push([]);
    }

    rows.push([`【${CATEGORY_LABEL[cat]}】団体順位`]);
    rows.push([
      "順位",
      "チーム",
      "登録人数",
      ...apparatus.map((a) => a.name_ja),
      "総得点",
    ]);
    for (const t of r.teams) {
      rows.push([
        t.rank ?? "",
        t.team.name,
        `${t.memberCount}/${t.teamSize}`,
        ...t.perApparatus.map((pa) => fromMilli(pa.score)),
        fromMilli(t.total),
      ]);
    }
    rows.push([]);
    rows.push([]);
  }

  return toCsv(rows);
}
