"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { getCompetition } from "@/lib/db/queries";
import {
  assertCanEditD,
  assertCanEditE,
  GuardError,
  type Actor,
} from "@/lib/auth/guards";
import { type ActionResult, fail, ok } from "@/lib/actions/result";

/**
 * "13.4" → "13.400" / "" → null。範囲外・不正は例外。
 * maxDecimals: D / ND は 1、E は 3 (SB はトグルなので対象外)。
 */
function parseScore(
  raw: FormDataEntryValue | null,
  label: string,
  maxDecimals = 3,
): string | null {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  const re = new RegExp(`^\\d{1,2}(\\.\\d{1,${maxDecimals}})?$`);
  if (!re.test(s)) {
    const ex = maxDecimals === 1 ? "13.4" : "13.400";
    throw new GuardError(
      `${label} は小数第${maxDecimals}位まで、数値で入力してください (例: ${ex})。`,
    );
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 99.999) {
    throw new GuardError(`${label} は 0〜99.999 の範囲で入力してください。`);
  }
  return n.toFixed(3);
}

async function resolveActor(): Promise<{ actor: Actor; athleteId: string | null }> {
  const admin = await getCurrentAdmin();
  if (admin) return { actor: { kind: "admin" }, athleteId: null };
  const athlete = await getCurrentAthlete();
  if (athlete) return { actor: { kind: "athlete", athleteId: athlete.id }, athleteId: athlete.id };
  throw new GuardError("ログインが必要です。");
}

/** 選手 (または管理者代理) の D スコア + ND 一括保存。 */
export async function saveDScores(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const competitionId = String(formData.get("competition_id") ?? "");
    const targetAthleteId = String(formData.get("athlete_id") ?? "");
    const comp = await getCompetition(competitionId);
    if (!comp) return fail("試技会が見つかりません。");
    const { actor } = await resolveActor();
    assertCanEditD(comp, actor, targetAthleteId);

    const apparatusIds = formData.getAll("apparatus_id").map(String);
    const now = new Date().toISOString();
    let saved = 0;
    for (const apId of apparatusIds) {
      const value = parseScore(formData.get(`d_${apId}`), "D スコア", 1);
      const patch: Record<string, unknown> = { d_score: value, d_updated_at: now };
      // ND は選手も入力できる (フォームに nd_<id> があるときのみ更新)
      if (formData.has(`nd_${apId}`)) {
        patch.nd = parseScore(formData.get(`nd_${apId}`), "ND", 1) ?? "0.000";
      }
      const { error } = await db()
        .from("routines")
        .update(patch)
        .eq("competition_id", competitionId)
        .eq("athlete_id", targetAthleteId)
        .eq("apparatus_id", Number(apId));
      if (error) return fail("保存に失敗しました: " + error.message);
      saved += 1;
    }
    revalidatePath(`/admin/competitions/${competitionId}`, "layout");
    revalidatePath(`/athlete/competitions/${competitionId}`, "layout");
    return ok(`保存しました (${saved} 種目)`);
  } catch (e) {
    if (e instanceof GuardError) return fail(e.message);
    throw e;
  }
}

/** 管理者による 1 選手の全種目 E / ND / SB (と必要なら D 上書き) 一括保存。 */
export async function saveRoutineScores(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const competitionId = String(formData.get("competition_id") ?? "");
    const targetAthleteId = String(formData.get("athlete_id") ?? "");
    const comp = await getCompetition(competitionId);
    if (!comp) return fail("試技会が見つかりません。");
    const { actor } = await resolveActor();
    assertCanEditE(comp, actor);

    const apparatusIds = formData.getAll("apparatus_id").map(String);
    const now = new Date().toISOString();
    let saved = 0;
    for (const apId of apparatusIds) {
      const e_score = parseScore(formData.get(`e_${apId}`), "E スコア", 3);
      const nd = parseScore(formData.get(`nd_${apId}`), "ND", 1) ?? "0.000";
      const patch: Record<string, unknown> = {
        e_score,
        nd,
        e_updated_at: now,
      };
      // SB は男子のみ。男子行には sb_marker_<id> を必ず送るのでそれで判定
      // (女子は SB 欄自体が無いので更新しない)
      if (formData.has(`sb_marker_${apId}`)) {
        patch.sb =
          String(formData.get(`sb_${apId}`)) === "on" ? "0.100" : "0.000";
      }
      // D 上書き (任意)
      const dRaw = formData.get(`d_${apId}`);
      if (dRaw !== null) {
        patch.d_score = parseScore(dRaw, "D スコア", 1);
        patch.d_updated_at = now;
      }
      const { error } = await db()
        .from("routines")
        .update(patch)
        .eq("competition_id", competitionId)
        .eq("athlete_id", targetAthleteId)
        .eq("apparatus_id", Number(apId));
      if (error) return fail("保存に失敗しました: " + error.message);
      saved += 1;
    }
    revalidatePath(`/admin/competitions/${competitionId}`, "layout");
    revalidatePath(`/athlete/competitions/${competitionId}`, "layout");
    return ok(`採点を保存しました (${saved} 種目)`);
  } catch (e) {
    if (e instanceof GuardError) return fail(e.message);
    throw e;
  }
}

/**
 * 管理者による「1 種目 × 全選手」の一括保存 (種目ごと入力モード)。
 * フィールド名は選手 ID をキーにする: d_<athleteId> / e_<athleteId> / nd_<athleteId> / sb_<athleteId>
 */
export async function saveApparatusScores(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const competitionId = String(formData.get("competition_id") ?? "");
    const apparatusId = Number(formData.get("apparatus_id") ?? 0);
    const comp = await getCompetition(competitionId);
    if (!comp) return fail("試技会が見つかりません。");
    if (!apparatusId) return fail("種目が不明です。");
    const { actor } = await resolveActor();
    assertCanEditE(comp, actor);

    const athleteIds = formData.getAll("athlete_id").map(String);
    const now = new Date().toISOString();
    let saved = 0;
    for (const athleteId of athleteIds) {
      const e_score = parseScore(formData.get(`e_${athleteId}`), "E スコア", 3);
      const nd = parseScore(formData.get(`nd_${athleteId}`), "ND", 1) ?? "0.000";
      const patch: Record<string, unknown> = {
        e_score,
        nd,
        e_updated_at: now,
      };
      // SB は男子のみ (男子行だけ sb_marker_<athleteId> を送る)
      if (formData.has(`sb_marker_${athleteId}`)) {
        patch.sb =
          String(formData.get(`sb_${athleteId}`)) === "on" ? "0.100" : "0.000";
      }
      // D 上書き (任意)
      const dRaw = formData.get(`d_${athleteId}`);
      if (dRaw !== null) {
        patch.d_score = parseScore(dRaw, "D スコア", 1);
        patch.d_updated_at = now;
      }
      const { error } = await db()
        .from("routines")
        .update(patch)
        .eq("competition_id", competitionId)
        .eq("athlete_id", athleteId)
        .eq("apparatus_id", apparatusId);
      if (error) return fail("保存に失敗しました: " + error.message);
      saved += 1;
    }
    revalidatePath(`/admin/competitions/${competitionId}`, "layout");
    revalidatePath(`/athlete/competitions/${competitionId}`, "layout");
    return ok(`採点を保存しました (${saved} 名)`);
  } catch (e) {
    if (e instanceof GuardError) return fail(e.message);
    throw e;
  }
}
