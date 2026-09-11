"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Input } from "@/components/ui";
import { toMilli, fromMilli, trimZeros } from "@/lib/scoring/milli";
import { finalScore } from "@/lib/scoring/finalScore";
import { saveApparatusScores } from "@/lib/actions/scores";
import { athleteLabel, type Athlete, type RoutineViewRow } from "@/lib/types";

interface Row {
  athleteId: string;
  name: string;
  hasSB: boolean; // 男子のみ SB あり
  d: string;
  e: string;
  nd: string;
  sb: boolean;
}

function initRows(athletes: Athlete[], rows: RoutineViewRow[]): Row[] {
  const byAthlete = new Map(rows.map((r) => [r.athlete_id, r]));
  return athletes.map((a) => {
    const r = byAthlete.get(a.id);
    return {
      athleteId: a.id,
      name: athleteLabel(a),
      hasSB: a.category === "MAG",
      d: trimZeros(r?.d_score ?? ""), // D は小数第1位
      e: r?.e_score ?? "", // E は小数第3位までそのまま
      nd: trimZeros(r?.nd && Number(r.nd) !== 0 ? r.nd : ""),
      sb: Number(r?.sb ?? 0) === 0.1,
    };
  });
}

/** 1 種目 × 全選手をまとめて採点入力する。 */
export function ApparatusScoreForm({
  competitionId,
  apparatusId,
  apparatusName,
  athletes,
  routineRows,
  nextApparatusId,
}: {
  competitionId: string;
  apparatusId: number;
  apparatusName: string;
  athletes: Athlete[];
  routineRows: RoutineViewRow[];
  nextApparatusId: number | null;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState<Row[]>(() =>
    initRows(athletes, routineRows),
  );
  const goNextRef = React.useRef(false);

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const preview = (r: Row) =>
    finalScore({
      d: toMilli(r.d),
      e: toMilli(r.e),
      nd: toMilli(r.nd) ?? 0,
      sb: r.sb ? 100 : 0,
    });

  return (
    <ActionForm
      action={saveApparatusScores}
      onSuccess={() => {
        if (goNextRef.current && nextApparatusId) {
          router.push(
            `/admin/competitions/${competitionId}/apparatus/${nextApparatusId}`,
          );
        } else {
          router.refresh();
        }
      }}
    >
      <input type="hidden" name="competition_id" value={competitionId} />
      <input type="hidden" name="apparatus_id" value={apparatusId} />
      <h2 className="text-base font-semibold mb-3">
        {apparatusName} の採点（{rows.length} 名）
      </h2>

      <div className="space-y-3">
        {rows.map((r, i) => {
          const f = preview(r);
          return (
            <div
              key={r.athleteId}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <input type="hidden" name="athlete_id" value={r.athleteId} />
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{r.name}</span>
                <span className="text-sm tabular">
                  最終{" "}
                  {f === null ? (
                    <span className="text-[var(--color-muted)]">未確定</span>
                  ) : (
                    <span className="font-semibold">{fromMilli(f, 3)}</span>
                  )}
                </span>
              </div>
              <div
                className={
                  "grid gap-3 " +
                  (r.hasSB ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")
                }
              >
                <label className="block">
                  <span className="text-xs text-[var(--color-muted)]">
                    D スコア（小数第1位）
                  </span>
                  <Input
                    name={`d_${r.athleteId}`}
                    value={r.d}
                    onChange={(e) => set(i, { d: e.target.value })}
                    inputMode="decimal"
                    placeholder="5.6"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-[var(--color-muted)]">
                    E スコア（小数第3位）
                  </span>
                  <Input
                    name={`e_${r.athleteId}`}
                    value={r.e}
                    onChange={(e) => set(i, { e: e.target.value })}
                    inputMode="decimal"
                    placeholder="8.400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-[var(--color-muted)]">
                    ND（小数第1位）
                  </span>
                  <Input
                    name={`nd_${r.athleteId}`}
                    value={r.nd}
                    onChange={(e) => set(i, { nd: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </label>
                {r.hasSB && (
                  <label className="flex items-center gap-2 pt-4">
                    <input type="hidden" name={`sb_marker_${r.athleteId}`} value="1" />
                    <input
                      type="checkbox"
                      name={`sb_${r.athleteId}`}
                      checked={r.sb}
                      onChange={(e) => set(i, { sb: e.target.checked })}
                      className="size-5"
                    />
                    <span className="text-sm">SB (+0.1)</span>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 sticky bottom-3">
        <SubmitButton onClick={() => (goNextRef.current = false)}>保存</SubmitButton>
        {nextApparatusId && (
          <SubmitButton
            variant="secondary"
            onClick={() => (goNextRef.current = true)}
          >
            保存して次の種目へ →
          </SubmitButton>
        )}
      </div>
    </ActionForm>
  );
}
