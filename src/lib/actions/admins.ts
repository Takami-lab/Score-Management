"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { type ActionResult, fail, ok } from "@/lib/actions/result";

export async function createAdmin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("氏名を入力してください。");
  const { error } = await db().from("admins").insert({ name });
  if (error) return fail("登録に失敗しました: " + error.message);
  revalidatePath("/admin/admins");
  return ok("管理者を追加しました");
}

export async function setAdminActive(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (id === me.id && !active) {
    return fail("自分自身を無効化することはできません。");
  }
  const { error } = await db().from("admins").update({ is_active: active }).eq("id", id);
  if (error) return fail("変更に失敗しました: " + error.message);
  revalidatePath("/admin/admins");
  return ok(active ? "有効化しました" : "無効化しました");
}
