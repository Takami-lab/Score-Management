import "server-only";
import { cookies } from "next/headers";
import { getAthlete } from "@/lib/db/queries";
import type { Athlete } from "@/lib/types";

// 選手ログインは認証システムを持たず、名簿から自分を選ぶだけ。
// 選択した athlete_id を httpOnly Cookie に保存する。
const COOKIE = "athlete_id";
const MAX_AGE = 60 * 60 * 12; // 12時間

export async function setAthleteSession(athleteId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, athleteId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAthleteSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function getAthleteId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function getCurrentAthlete(): Promise<Athlete | null> {
  const id = await getAthleteId();
  if (!id) return null;
  const athlete = await getAthlete(id);
  if (!athlete || !athlete.is_active) return null;
  return athlete;
}
