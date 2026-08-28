"use client";
import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Input, Label, Table, Th, Td, Badge } from "@/components/ui";
import { createAdmin, setAdminActive } from "@/lib/actions/admins";

interface AdminRow {
  id: string;
  name: string;
  is_active: boolean;
}

export function AdminsManager({
  admins,
  currentId,
}: {
  admins: AdminRow[];
  currentId: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">管理者</h1>
        <p className="text-sm text-[var(--color-muted)]">
          ログインは「一覧から選択 + 共通パスワード」方式です。
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <ActionForm action={createAdmin}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>氏名</Label>
              <Input name="name" required placeholder="採点 太郎" />
            </div>
            <SubmitButton>追加</SubmitButton>
          </div>
        </ActionForm>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>氏名</Th>
            <Th>状態</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id} className={a.is_active ? "" : "opacity-50"}>
              <Td>
                {a.name}
                {a.id === currentId && (
                  <Badge tone="primary" className="ml-2">
                    自分
                  </Badge>
                )}
              </Td>
              <Td>
                {a.is_active ? (
                  <Badge tone="success">有効</Badge>
                ) : (
                  <Badge tone="neutral">無効</Badge>
                )}
              </Td>
              <Td className="text-right">
                {a.id !== currentId && (
                  <ActionForm action={setAdminActive} successMessage="" className="inline">
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="active" value={String(!a.is_active)} />
                    <SubmitButton size="sm" variant="ghost">
                      {a.is_active ? "無効化" : "有効化"}
                    </SubmitButton>
                  </ActionForm>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
