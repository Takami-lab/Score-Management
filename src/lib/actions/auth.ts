"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/server";
import {
  setAdminSession,
  clearAdminSession,
  sharedPassword,
} from "@/lib/auth/admin";
import { setAthleteSession, clearAthleteSession } from "@/lib/auth/athlete";
import { getAthlete } from "@/lib/db/queries";
import { type ActionResult, fail } from "@/lib/actions/result";

export async function adminLogin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = String(formData.get("admin_id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!adminId) return fail("管理者を選択してください。");
  if (password !== sharedPassword()) return fail("パスワードが違います。");

  const { data, error } = await db()
    .from("admins")
    .select("id")
    .eq("id", adminId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return fail("ログインに失敗しました: " + error.message);
  if (!data) return fail("選択された管理者が見つかりません。");

  await setAdminSession(adminId);
  redirect("/admin/dashboard");
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function athleteLogin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const athleteId = String(formData.get("athlete_id") ?? "");
  if (!athleteId) return fail("選手を選択してください。");
  const athlete = await getAthlete(athleteId);
  if (!athlete || !athlete.is_active) return fail("選択された選手が見つかりません。");
  await setAthleteSession(athleteId);
  redirect("/athlete/competitions");
}

export async function athleteLogout(): Promise<void> {
  await clearAthleteSession();
  revalidatePath("/", "layout");
  redirect("/athlete/login");
}
