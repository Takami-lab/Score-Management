"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Input, Badge } from "@/components/ui";
import { toMilli, fromMilli, trimZeros } from "@/lib/scoring/milli";
import { finalScore } from "@/lib/scoring/finalScore";
import { saveDScores } from "@/lib/actions/scores";
import type { RoutineViewRow } from "@/lib/types";

export function DInputForm({
  competitionId,
  athleteId,
  routineRows,
  editable,
}: {
  competitionId: string;
  athleteId: string;
  routineRows: RoutineViewRow[];
  editable: boolean;
}) {
  const router = useRouter();
  const sorted = [...routineRows].sort(
    (a, b) => a.apparatus_sort_order - b.apparatus_sort_order,
  );
  const [dvals, setDvals] = React.useState<Record<number, string>>(() =>
    Object.fromEntries(sorted.map((r) => [r.apparatus_id, trimZeros(r.d_score)])),
  );
  const [ndvals, setNdvals] = React.useState<Record<number, string>>(() =>
    Object.fromEntries(
      sorted.map((r) => [
        r.apparatus_id,
        trimZeros(r.nd && Number(r.nd) !== 0 ? r.nd : ""),
      ]),
    ),
  );

  return (
    <ActionForm action={saveDScores} onSuccess={() => router.refresh()}>
      <input type="hidden" name="competition_id" value={competitionId} />
      <input type="hidden" name="athlete_id" value={athleteId} />

      {!editable && (
        <p className="mb-3 text-sm rounded-md bg-[var(--color-accent)] px-3 py-2">
          この試技会は D スコアの入力を締め切りました。以下は参照のみです。
        </p>
      )}

      <div className="space-y-3">
        {sorted.map((r) => {
          const hasSB = r.category === "MAG";
          const e = toMilli(r.e_score);
          const sb = toMilli(r.sb) ?? 0;
          const d = toMilli(dvals[r.apparatus_id]);
          const nd = toMilli(ndvals[r.apparatus_id]) ?? 0;
          const f = finalScore({ d, e, nd, sb });
          return (
            <div
              key={r.apparatus_id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <input type="hidden" name="apparatus_id" value={r.apparatus_id} />
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{r.apparatus_name}</span>
                {r.e_score === null ? (
                  <Badge tone="warning">採点待ち</Badge>
                ) : (
                  <Badge tone="success">最終 {fromMilli(f, 3)}</Badge>
                )}
              </div>
              <div
                className={
                  "grid gap-3 text-sm " +
                  (hasSB ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")
                }
              >
                <label className="block">
                  <span className="text-[var(--color-muted)] text-xs">
                    D スコア（小数第1位）
                  </span>
                  <Input
                    name={`d_${r.apparatus_id}`}
                    value={dvals[r.apparatus_id]}
                    onChange={(ev) =>
                      setDvals((s) => ({ ...s, [r.apparatus_id]: ev.target.value }))
                    }
                    inputMode="decimal"
                    placeholder="5.6"
                    readOnly={!editable}
                    className={!editable ? "opacity-60" : ""}
                  />
                </label>
                <label className="block">
                  <span className="text-[var(--color-muted)] text-xs">
                    ND（減点・小数第1位）
                  </span>
                  <Input
                    name={`nd_${r.apparatus_id}`}
                    value={ndvals[r.apparatus_id]}
                    onChange={(ev) =>
                      setNdvals((s) => ({ ...s, [r.apparatus_id]: ev.target.value }))
                    }
                    inputMode="decimal"
                    placeholder="0"
                    readOnly={!editable}
                    className={!editable ? "opacity-60" : ""}
                  />
                </label>
                <div>
                  <span className="text-[var(--color-muted)] text-xs">E スコア</span>
                  <div className="min-h-11 flex items-center tabular">
                    {r.e_score === null ? "—" : fromMilli(e, 3)}
                  </div>
                </div>
                {hasSB && (
                  <div>
                    <span className="text-[var(--color-muted)] text-xs">SB</span>
                    <div className="min-h-11 flex items-center tabular">
                      {sb ? `+${fromMilli(sb, 1)}` : "—"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editable && (
        <div className="mt-4 sticky bottom-3">
          <SubmitButton className="w-full shadow-lg">D・ND を保存</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
