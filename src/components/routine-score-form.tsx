"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Input, Table, Th, Td } from "@/components/ui";
import { toMilli, fromMilli } from "@/lib/scoring/milli";
import { finalScore } from "@/lib/scoring/finalScore";
import { saveRoutineScores } from "@/lib/actions/scores";
import type { RoutineViewRow } from "@/lib/types";

interface Row {
  apparatusId: number;
  name: string;
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
      d: r.d_score ?? "",
      e: r.e_score ?? "",
      nd: r.nd && Number(r.nd) !== 0 ? String(Number(r.nd)) : "",
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
      <Table>
        <thead>
          <tr>
            <Th>種目</Th>
            <Th className="w-24">D</Th>
            <Th className="w-24">E</Th>
            <Th className="w-24">ND</Th>
            <Th className="w-16 text-center">SB</Th>
            <Th className="w-24 text-right">最終</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const f = preview(r);
            return (
              <tr key={r.apparatusId}>
                <Td>
                  <input type="hidden" name="apparatus_id" value={r.apparatusId} />
                  {r.name}
                </Td>
                <Td>
                  <Input
                    name={`d_${r.apparatusId}`}
                    value={r.d}
                    onChange={(e) => set(i, { d: e.target.value })}
                    inputMode="decimal"
                    placeholder="5.600"
                    readOnly={!editableD}
                    className={!editableD ? "opacity-60" : ""}
                  />
                </Td>
                <Td>
                  <Input
                    name={`e_${r.apparatusId}`}
                    value={r.e}
                    onChange={(e) => set(i, { e: e.target.value })}
                    inputMode="decimal"
                    placeholder="8.400"
                  />
                </Td>
                <Td>
                  <Input
                    name={`nd_${r.apparatusId}`}
                    value={r.nd}
                    onChange={(e) => set(i, { nd: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </Td>
                <Td className="text-center">
                  <input
                    type="checkbox"
                    name={`sb_${r.apparatusId}`}
                    checked={r.sb}
                    onChange={(e) => set(i, { sb: e.target.checked })}
                    className="size-5"
                  />
                </Td>
                <Td className="text-right font-medium tabular">
                  {f === null ? (
                    <span className="text-[var(--color-muted)]">未確定</span>
                  ) : (
                    fromMilli(f)
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

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
