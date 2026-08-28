"use client";
import * as React from "react";
import { adminLogin } from "@/lib/actions/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Select, Input, Label } from "@/components/ui";

export function AdminLoginForm({
  admins,
}: {
  admins: { id: string; name: string }[];
}) {
  const [adminId, setAdminId] = React.useState("");
  return (
    <ActionForm action={adminLogin} successMessage="">
      <div className="space-y-4">
        <div>
          <Label htmlFor="admin_id">氏名</Label>
          <Select
            id="admin_id"
            name="admin_id"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            required
          >
            <option value="" disabled>
              選択してください
            </option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            name="password"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            required
          />
        </div>
        <SubmitButton className="w-full">ログイン</SubmitButton>
      </div>
    </ActionForm>
  );
}
