"use client";
import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Button, Input, Select, Label, Table, Th, Td, Badge } from "@/components/ui";
import { CATEGORY_LABEL, type Athlete } from "@/lib/types";
import { createAthlete, updateAthlete, setAthleteActive } from "@/lib/actions/roster";

function Fields({ a }: { a?: Athlete }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>姓</Label>
        <Input name="last_name" defaultValue={a?.last_name} required />
      </div>
      <div>
        <Label>名</Label>
        <Input name="first_name" defaultValue={a?.first_name} required />
      </div>
      <div>
        <Label>かな</Label>
        <Input name="kana" defaultValue={a?.kana ?? ""} placeholder="やまだ たろう" />
      </div>
      <div>
        <Label>カテゴリ</Label>
        <Select name="category" defaultValue={a?.category ?? ""} required>
          <option value="" disabled>
            選択
          </option>
          <option value="MAG">男子 (MAG)</option>
          <option value="WAG">女子 (WAG)</option>
        </Select>
      </div>
      <div>
        <Label>所属・学年</Label>
        <Input name="affiliation" defaultValue={a?.affiliation ?? ""} placeholder="3年" />
      </div>
      <div>
        <Label>誕生日 (MMDD・任意)</Label>
        <Input name="birth_mmdd" defaultValue={a?.birth_mmdd ?? ""} inputMode="numeric" maxLength={4} placeholder="0310" />
      </div>
    </div>
  );
}

export function RosterManager({ athletes }: { athletes: Athlete[] }) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">選手名簿</h1>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "閉じる" : "選手を追加"}
        </Button>
      </div>

      {creating && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <ActionForm action={createAthlete} onSuccess={() => setCreating(false)}>
            <Fields />
            <div className="mt-3">
              <SubmitButton>登録</SubmitButton>
            </div>
          </ActionForm>
        </div>
      )}

      <Table>
        <thead>
          <tr>
            <Th>選手</Th>
            <Th>かな</Th>
            <Th>カテゴリ</Th>
            <Th>所属</Th>
            <Th>状態</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {athletes.map((a) => (
            <React.Fragment key={a.id}>
              <tr className={a.is_active ? "" : "opacity-50"}>
                <Td>
                  {a.last_name} {a.first_name}
                </Td>
                <Td className="text-[var(--color-muted)]">{a.kana ?? "—"}</Td>
                <Td>{CATEGORY_LABEL[a.category]}</Td>
                <Td>{a.affiliation ?? "—"}</Td>
                <Td>
                  {a.is_active ? (
                    <Badge tone="success">有効</Badge>
                  ) : (
                    <Badge tone="neutral">無効</Badge>
                  )}
                </Td>
                <Td className="text-right whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(editing === a.id ? null : a.id)}
                  >
                    編集
                  </Button>
                  <ActionForm action={setAthleteActive} className="inline" successMessage="">
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="active" value={String(!a.is_active)} />
                    <SubmitButton size="sm" variant="ghost">
                      {a.is_active ? "無効化" : "有効化"}
                    </SubmitButton>
                  </ActionForm>
                </Td>
              </tr>
              {editing === a.id && (
                <tr>
                  <Td colSpan={6} className="bg-[var(--color-background)]">
                    <ActionForm action={updateAthlete} onSuccess={() => setEditing(null)}>
                      <input type="hidden" name="id" value={a.id} />
                      <Fields a={a} />
                      <div className="mt-3">
                        <SubmitButton>更新</SubmitButton>
                      </div>
                    </ActionForm>
                  </Td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
