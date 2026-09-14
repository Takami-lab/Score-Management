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

  // 試技会をまたいだ得点推移のため、同名・同カテゴリのチーム台帳に紐付ける
  // (無ければ作る)。既存の台帳は変更しない。
  const profileId = await ensureTeamProfile(name, category);

  const { error } = await db()
    .from("teams")
    .insert({
      competition_id: competitionId,
      name,
      category,
      team_profile_id: profileId,
    });
  if (error) return fail("作成に失敗しました: " + error.message);
  revalidatePath(`/admin/competitions/${competitionId}/teams`);
  revalidatePath("/admin/progress");
  return ok("チームを作成しました");
}

/** (name, category) の台帳を取得。無ければ作成して id を返す。 */
async function ensureTeamProfile(
  name: string,
  category: Category,
): Promise<string | null> {
  const existing = await db()
    .from("team_profiles")
    .select("id")
    .eq("name", name)
    .eq("category", category)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id as string;

  const created = await db()
    .from("team_profiles")
    .insert({ name, category })
    .select("id")
    .maybeSingle();
  if (created.data?.id) return created.data.id as string;

  // 競合などで作れなかった場合は再取得 (それでも駄目なら未紐付けで続行)
  const retry = await db()
    .from("team_profiles")
    .select("id")
    .eq("name", name)
    .eq("category", category)
    .maybeSingle();
  return (retry.data?.id as string) ?? null;
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
