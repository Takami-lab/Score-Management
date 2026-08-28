import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/server";

/**
 * 管理者ログインも選手と同様「名簿から選択」方式。
 * 認証は全員共通の合言葉パスワード (既定 09548 / ADMIN_SHARED_PASSWORD で上書き可)。
 * 選択した admin_id を httpOnly Cookie に保存する。
 */
const COOKIE = "admin_id";
const MAX_AGE = 60 * 60 * 12; // 12時間

export interface Admin {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function sharedPassword(): string {
  return process.env.ADMIN_SHARED_PASSWORD || "09548";
}

export async function setAdminSession(adminId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, adminId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function getCurrentAdmin(): Promise<Admin | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const { data, error } = await db()
    .from("admins")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as Admin) ?? null;
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
