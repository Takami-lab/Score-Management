"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Input } from "@/components/ui";
import { toMilli, fromMilli, trimZeros } from "@/lib/scoring/milli";
import { finalScore } from "@/lib/scoring/finalScore";
import { saveRoutineScores } from "@/lib/actions/scores";
import type { RoutineViewRow } from "@/lib/types";

interface Row {
  apparatusId: number;
  name: string;
  hasSB: boolean; // 男子のみ SB あり
  d: string;
  e: string;
  nd: string;
  sb: boolean;
}

function initRows(rows: RoutineViewRow[]): Row[] {
  return [...rows]
    .sort((a, b) => a.apparatus_sort_order - b.apparatus_sort_order)
    .map((r) => ({
      apparatusId: r.apparatus_id,
      name: r.apparatus_name,
      hasSB: r.category === "MAG",
      d: trimZeros(r.d_score), // D は小数第1位
      e: r.e_score ?? "", // E は小数第3位までそのまま
      nd: trimZeros(r.nd && Number(r.nd) !== 0 ? r.nd : ""),
      sb: Number(r.sb) === 0.1,
    }));
}

export function RoutineScoreForm({
  competitionId,
  athleteId,
  athleteName,
  routineRows,
  nextAthleteId,
  editableD,
}: {
  competitionId: string;
  athleteId: string;
  athleteName: string;
  routineRows: RoutineViewRow[];
  nextAthleteId: string | null;
  editableD: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState<Row[]>(() => initRows(routineRows));
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
      action={saveRoutineScores}
      onSuccess={() => {
        if (goNextRef.current && nextAthleteId) {
          router.push(`/admin/competitions/${competitionId}/scores/${nextAthleteId}`);
        } else {
          router.refresh();
        }
      }}
    >
      <input type="hidden" name="competition_id" value={competitionId} />
      <input type="hidden" name="athlete_id" value={athleteId} />
      <h2 className="text-base font-semibold mb-3">{athleteName} の採点</h2>
      <div className="space-y-3">
        {rows.map((r, i) => {
          const f = preview(r);
          return (
            <div
              key={r.apparatusId}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <input type="hidden" name="apparatus_id" value={r.apparatusId} />
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="block">
                  <span className="text-xs text-[var(--color-muted)]">
                    D スコア（小数第1位）
                  </span>
                  <Input
                    name={`d_${r.apparatusId}`}
                    value={r.d}
                    onChange={(e) => set(i, { d: e.target.value })}
                    inputMode="decimal"
                    placeholder="5.6"
                    readOnly={!editableD}
                    className={!editableD ? "opacity-60" : ""}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-[var(--color-muted)]">
                    E スコア（小数第3位）
                  </span>
                  <Input
                    name={`e_${r.apparatusId}`}
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
                    name={`nd_${r.apparatusId}`}
                    value={r.nd}
                    onChange={(e) => set(i, { nd: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </label>
                {r.hasSB && (
                  <label className="flex items-center gap-2 pt-4">
                    <input type="hidden" name={`sb_marker_${r.apparatusId}`} value="1" />
                    <input
                      type="checkbox"
                      name={`sb_${r.apparatusId}`}
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

      {!editableD && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          D スコアは選手入力欄です（現在のステータスでは編集不可・参照のみ）。
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <SubmitButton onClick={() => (goNextRef.current = false)}>保存</SubmitButton>
        {nextAthleteId && (
          <SubmitButton
            variant="secondary"
            onClick={() => (goNextRef.current = true)}
          >
            保存して次の選手へ →
          </SubmitButton>
        )}
      </div>
    </ActionForm>
  );
}
