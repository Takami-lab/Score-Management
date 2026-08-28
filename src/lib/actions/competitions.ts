"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getCompetition } from "@/lib/db/queries";
import { type ActionResult, fail, ok } from "@/lib/actions/result";
import type { CompetitionStatus } from "@/lib/types";
import { STATUS_ORDER } from "@/lib/types";

export async function createCompetition(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const held_on = String(formData.get("held_on") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim() || null;
  if (!name || !held_on) return fail("名称と日付は必須です。");
  const { data, error } = await db()
    .from("competitions")
    .insert({ name, held_on, venue })
    .select("id")
    .single();
  if (error) return fail("作成に失敗しました: " + error.message);
  revalidatePath("/admin/dashboard");
  redirect(`/admin/competitions/${data.id}/settings`);
}

export async function updateCompetition(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const held_on = String(formData.get("held_on") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim() || null;
  if (!id) return fail("対象が不明です。");
  if (!name || !held_on) return fail("名称と日付は必須です。");
  const { error } = await db()
    .from("competitions")
    .update({ name, held_on, venue })
    .eq("id", id);
  if (error) return fail("更新に失敗しました: " + error.message);
  revalidatePath(`/admin/competitions/${id}/settings`);
  revalidatePath("/admin/dashboard");
  return ok("日程を更新しました");
}

export async function setCompetitionStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as CompetitionStatus;
  if (!STATUS_ORDER.includes(status)) return fail("不正なステータスです。");
  const comp = await getCompetition(id);
  if (!comp) return fail("試技会が見つかりません。");
  const { error } = await db().from("competitions").update({ status }).eq("id", id);
  if (error) return fail("変更に失敗しました: " + error.message);
  revalidatePath(`/admin/competitions/${id}`, "layout");
  revalidatePath("/athlete", "layout");
  return ok(`ステータスを「${status}」に変更しました`);
}
