"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getCompetition } from "@/lib/db/queries";
import { type ActionResult, fail, ok } from "@/lib/actions/result";

/**
 * 参加者を一括設定する。チェックされた選手集合を「あるべき状態」として、
 * 追加分は add_entry (routines 自動生成)、削除分は remove_entry (空 routine のみ削除) を呼ぶ。
 */
export async function setEntries(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const competitionId = String(formData.get("competition_id") ?? "");
  const comp = await getCompetition(competitionId);
  if (!comp) return fail("試技会が見つかりません。");

  const desired = new Set(formData.getAll("athlete_id").map(String));

  const { data: current, error: curErr } = await db()
    .from("competition_entries")
    .select("athlete_id")
    .eq("competition_id", competitionId);
  if (curErr) return fail("取得に失敗しました: " + curErr.message);
  const currentSet = new Set((current ?? []).map((r) => r.athlete_id as string));

  const toAdd = [...desired].filter((id) => !currentSet.has(id));
  const toRemove = [...currentSet].filter((id) => !desired.has(id));

  for (const athleteId of toAdd) {
    const { error } = await db().rpc("add_entry", {
      p_competition: competitionId,
      p_athlete: athleteId,
    });
    if (error) return fail("参加者追加に失敗しました: " + error.message);
  }
  for (const athleteId of toRemove) {
    const { error } = await db().rpc("remove_entry", {
      p_competition: competitionId,
      p_athlete: athleteId,
    });
    if (error) return fail("参加者削除に失敗しました: " + error.message);
  }

  revalidatePath(`/admin/competitions/${competitionId}`, "layout");
  return ok(`参加者を更新しました (追加 ${toAdd.length} / 削除 ${toRemove.length})`);
}
