"use client";
import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardBody, Input, Select, Label, Badge } from "@/components/ui";
import { CATEGORY_LABEL, athleteLabel, type Athlete, type Category, type Team } from "@/lib/types";
import { createTeam, deleteTeam, setTeamMembers } from "@/lib/actions/teams";

export function TeamsEditor({
  competitionId,
  teams,
  entries,
  membersByTeam,
  rules,
}: {
  competitionId: string;
  teams: Team[];
  entries: Athlete[];
  membersByTeam: Record<string, string[]>;
  rules: Record<Category, { team_size: number; counting_count: number }>;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h2 className="text-base font-semibold mb-3">チームを作成</h2>
          <ActionForm action={createTeam} successMessage="">
            <input type="hidden" name="competition_id" value={competitionId} />
            <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
              <div>
                <Label>チーム名</Label>
                <Input name="name" required placeholder="A校 男子" />
              </div>
              <div>
                <Label>カテゴリ</Label>
                <Select name="category" defaultValue="" required>
                  <option value="" disabled>
                    選択
                  </option>
                  <option value="MAG">男子</option>
                  <option value="WAG">女子</option>
                </Select>
              </div>
              <SubmitButton>作成</SubmitButton>
            </div>
          </ActionForm>
        </CardBody>
      </Card>

      {teams.map((team) => (
        <TeamCard
          key={team.id}
          competitionId={competitionId}
          team={team}
          entries={entries.filter((a) => a.category === team.category)}
          memberIds={membersByTeam[team.id] ?? []}
          rule={rules[team.category]}
        />
      ))}
    </div>
  );
}

function TeamCard({
  competitionId,
  team,
  entries,
  memberIds,
  rule,
}: {
  competitionId: string;
  team: Team;
  entries: Athlete[];
  memberIds: string[];
  rule: { team_size: number; counting_count: number };
}) {
  const [checked, setChecked] = React.useState<Set<string>>(() => new Set(memberIds));
  const [prevIds, setPrevIds] = React.useState(memberIds);
  if (prevIds !== memberIds) {
    setPrevIds(memberIds);
    setChecked(new Set(memberIds));
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold">{team.name}</h3>
          <Badge tone="neutral">{CATEGORY_LABEL[team.category]}</Badge>
          <Badge tone={checked.size > rule.team_size ? "danger" : "neutral"}>
            {checked.size}/{rule.team_size}名（上位{rule.counting_count}名採用）
          </Badge>
          <ActionForm action={deleteTeam} successMessage="" className="ml-auto">
            <input type="hidden" name="team_id" value={team.id} />
            <input type="hidden" name="competition_id" value={competitionId} />
            <SubmitButton size="sm" variant="ghost">
              削除
            </SubmitButton>
          </ActionForm>
        </div>

        <ActionForm action={setTeamMembers} successMessage="">
          <input type="hidden" name="team_id" value={team.id} />
          <input type="hidden" name="competition_id" value={competitionId} />
          <input type="hidden" name="category" value={team.category} />
          <div className="grid gap-1.5 sm:grid-cols-2">
            {entries.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--color-accent)] cursor-pointer text-sm"
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
                {athleteLabel(a)}
              </label>
            ))}
            {entries.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">
                このカテゴリの参加者がいません。
              </p>
            )}
          </div>
          <div className="mt-3">
            <SubmitButton size="sm">メンバーを保存</SubmitButton>
          </div>
        </ActionForm>
      </CardBody>
    </Card>
  );
}
