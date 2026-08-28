"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { type ActionResult, fail, ok } from "@/lib/actions/result";
import type { Category } from "@/lib/types";

function parseAthleteForm(formData: FormData) {
  const last_name = String(formData.get("last_name") ?? "").trim();
  const first_name = String(formData.get("first_name") ?? "").trim();
  const kana = String(formData.get("kana") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "") as Category;
  const affiliation = String(formData.get("affiliation") ?? "").trim() || null;
  const birthRaw = String(formData.get("birth_mmdd") ?? "").trim();
  const birth_mmdd = birthRaw ? birthRaw.replace(/\D/g, "").padStart(4, "0").slice(0, 4) : null;
  return { last_name, first_name, kana, category, affiliation, birth_mmdd };
}

export async function createAthlete(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const v = parseAthleteForm(formData);
  if (!v.last_name || !v.first_name) return fail("姓と名は必須です。");
  if (v.category !== "MAG" && v.category !== "WAG") return fail("カテゴリを選択してください。");
  const { error } = await db().from("athletes").insert(v);
  if (error) return fail("登録に失敗しました: " + error.message);
  revalidatePath("/admin/athletes");
  return ok("選手を登録しました");
}

export async function updateAthlete(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("対象が不明です。");
  const v = parseAthleteForm(formData);
  if (!v.last_name || !v.first_name) return fail("姓と名は必須です。");
  const { error } = await db().from("athletes").update(v).eq("id", id);
  if (error) return fail("更新に失敗しました: " + error.message);
  revalidatePath("/admin/athletes");
  return ok("更新しました");
}

export async function setAthleteActive(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  const { error } = await db().from("athletes").update({ is_active: active }).eq("id", id);
  if (error) return fail("変更に失敗しました: " + error.message);
  revalidatePath("/admin/athletes");
  return ok(active ? "有効化しました" : "無効化しました");
}
