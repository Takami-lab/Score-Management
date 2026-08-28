"use client";
import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Select, Label } from "@/components/ui";
import { athleteLogin } from "@/lib/actions/auth";
import { CATEGORY_LABEL, athleteLabel, type Athlete } from "@/lib/types";

export function AthleteLoginForm({ athletes }: { athletes: Athlete[] }) {
  const groups = {
    MAG: athletes.filter((a) => a.category === "MAG"),
    WAG: athletes.filter((a) => a.category === "WAG"),
  };
  return (
    <ActionForm action={athleteLogin} successMessage="">
      <Label htmlFor="athlete_id">氏名</Label>
      <Select id="athlete_id" name="athlete_id" defaultValue="" required>
        <option value="" disabled>
          選択してください
        </option>
        {(["MAG", "WAG"] as const).map((c) =>
          groups[c].length ? (
            <optgroup key={c} label={CATEGORY_LABEL[c]}>
              {groups[c].map((a) => (
                <option key={a.id} value={a.id}>
                  {athleteLabel(a)}
                </option>
              ))}
            </optgroup>
          ) : null,
        )}
      </Select>
      <div className="mt-4">
        <SubmitButton className="w-full">ログイン</SubmitButton>
      </div>
    </ActionForm>
  );
}
