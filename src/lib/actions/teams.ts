"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getCompetition, getTeamRules } from "@/lib/db/queries";
import { type ActionResult, fail, ok } from "@/lib/actions/result";
import type { Category } from "@/lib/types";

export async function createTeam(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const competitionId = String(formData.get("competition_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "") as Category;
  if (!name) return fail("チーム名を入力してください。");
  if (category !== "MAG" && category !== "WAG") return fail("カテゴリを選択してください。");
  const comp = await getCompetition(competitionId);
  if (!comp) return fail("試技会が見つかりません。");
  const { error } = await db()
    .from("teams")
    .insert({ competition_id: competitionId, name, category });
  if (error) return fail("作成に失敗しました: " + error.message);
  revalidatePath(`/admin/competitions/${competitionId}/teams`);
  return ok("チームを作成しました");
}

export async function deleteTeam(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const teamId = String(formData.get("team_id") ?? "");
  const competitionId = String(formData.get("competition_id") ?? "");
  const { error } = await db().from("teams").delete().eq("id", teamId);
  if (error) return fail("削除に失敗しました: " + error.message);
  revalidatePath(`/admin/competitions/${competitionId}/teams`);
  return ok("チームを削除しました");
}

export async function setTeamMembers(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const teamId = String(formData.get("team_id") ?? "");
  const competitionId = String(formData.get("competition_id") ?? "");
  const category = String(formData.get("category") ?? "") as Category;
  const athleteIds = [...new Set(formData.getAll("athlete_id").map(String))];

  const rules = await getTeamRules();
  const rule = rules[category];
  if (rule && athleteIds.length > rule.team_size) {
    return fail(`登録人数は最大 ${rule.team_size} 名です (現在 ${athleteIds.length} 名選択)。`);
  }

  const del = await db().from("team_members").delete().eq("team_id", teamId);
  if (del.error) return fail("更新に失敗しました: " + del.error.message);
  if (athleteIds.length > 0) {
    const { error } = await db()
      .from("team_members")
      .insert(athleteIds.map((athlete_id) => ({ team_id: teamId, athlete_id })));
    if (error) return fail("更新に失敗しました: " + error.message);
  }
  revalidatePath(`/admin/competitions/${competitionId}/teams`);
  return ok("メンバーを更新しました");
}
