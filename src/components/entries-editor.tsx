"use client";
import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui";
import { CATEGORY_LABEL, athleteLabel, type Athlete, type Category } from "@/lib/types";
import { setEntries } from "@/lib/actions/entries";

export function EntriesEditor({
  competitionId,
  athletes,
  enteredIds,
}: {
  competitionId: string;
  athletes: Athlete[];
  enteredIds: string[];
}) {
  const [filter, setFilter] = React.useState<Category | "ALL">("ALL");
  const [checked, setChecked] = React.useState<Set<string>>(() => new Set(enteredIds));
  const [prevIds, setPrevIds] = React.useState(enteredIds);
  if (prevIds !== enteredIds) {
    setPrevIds(enteredIds);
    setChecked(new Set(enteredIds));
  }

  const visible = athletes.filter((a) => filter === "ALL" || a.category === filter);

  return (
    <ActionForm action={setEntries} successMessage="">
      <input type="hidden" name="competition_id" value={competitionId} />
      <div className="flex items-center gap-2 mb-3">
        {(["ALL", "MAG", "WAG"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "min-h-9 px-3 rounded-md text-sm border " +
              (filter === f
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent"
                : "border-[var(--color-border)]")
            }
          >
            {f === "ALL" ? "全て" : CATEGORY_LABEL[f]}
          </button>
        ))}
        <span className="ml-auto text-sm text-[var(--color-muted)]">
          選択中 {checked.size} 名
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-md border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {visible.map((a) => (
          <label
            key={a.id}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--color-accent)]"
          >
            <input
              type="checkbox"
              name="athlete_id"
              value={a.id}
              checked={checked.has(a.id)}
              onChange={(e) =>
                setChecked((s) => {
                  const n = new Set(s);
                  if (e.target.checked) n.add(a.id);
                  else n.delete(a.id);
                  return n;
                })
              }
              className="size-4"
            />
            <span className="flex-1 text-sm">{athleteLabel(a)}</span>
            <Badge tone="neutral">{CATEGORY_LABEL[a.category]}</Badge>
          </label>
        ))}
      </div>
      {/* フィルタで隠れているが選択済みの選手も送信する */}
      {athletes
        .filter((a) => checked.has(a.id) && !visible.includes(a))
        .map((a) => (
          <input key={a.id} type="hidden" name="athlete_id" value={a.id} />
        ))}

      <p className="mt-2 text-xs text-[var(--color-muted)]">
        追加すると全種目分の入力欄が自動生成されます。外すと未入力の種目のみ削除され、入力済みのスコアは保持されます。
      </p>
      <div className="mt-3">
        <SubmitButton>参加者を保存</SubmitButton>
      </div>
    </ActionForm>
  );
}
