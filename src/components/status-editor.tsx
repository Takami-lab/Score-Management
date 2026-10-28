"use client";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui";
import { setCompetitionStatus } from "@/lib/actions/competitions";
import { STATUS_LABEL, STATUS_ORDER, type CompetitionStatus } from "@/lib/types";

const HINT: Record<CompetitionStatus, string> = {
  draft: "設定中。選手には非表示。",
  open: "選手が D・ND を入力可能。採点入力も並行可。",
  locked: "D 入力締切。採点入力のみ。",
  finalized: "確定。結果は「暫定」表示が外れる。",
  open_de: "選手が D・ND に加え E・SB も自分で入力可能（自己採点）。",
};

export function StatusEditor({
  competitionId,
  current,
}: {
  competitionId: string;
  current: CompetitionStatus;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        現在:
        <Badge tone="primary">{STATUS_LABEL[current]}</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {STATUS_ORDER.map((s) => (
          <ActionForm
            key={s}
            action={setCompetitionStatus}
            successMessage=""
            className={
              "rounded-md border p-3 " +
              (s === current
                ? "border-[var(--color-primary)] bg-[var(--color-accent)]"
                : "border-[var(--color-border)]")
            }
          >
            <input type="hidden" name="id" value={competitionId} />
            <input type="hidden" name="status" value={s} />
            <div className="font-medium text-sm">{STATUS_LABEL[s]}（{s}）</div>
            <p className="text-xs text-[var(--color-muted)] mt-0.5 mb-2">{HINT[s]}</p>
            <SubmitButton size="sm" variant={s === current ? "secondary" : "primary"} disabled={s === current}>
              {s === current ? "現在のステータス" : "このステータスにする"}
            </SubmitButton>
          </ActionForm>
        ))}
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        ステータスは前後どちらの方向にも変更できます。
      </p>
    </div>
  );
}
