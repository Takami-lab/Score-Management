import type { Competition } from "@/lib/types";
import {
  ADMIN_SCORING_STATUSES,
  ATHLETE_D_STATUSES,
  ATHLETE_E_STATUSES,
  STATUS_LABEL,
} from "@/lib/types";

export type Actor = { kind: "admin" } | { kind: "athlete"; athleteId: string };

export class GuardError extends Error {}

/**
 * 選手 D / ND スコアの編集可否。
 * 選手は open・open_de の間、自分の行のみ。管理者は常に可 (代理・上書き)。
 */
export function assertCanEditD(
  competition: Competition,
  actor: Actor,
  targetAthleteId: string,
): void {
  if (actor.kind === "admin") return;
  if (!ATHLETE_D_STATUSES.includes(competition.status)) {
    throw new GuardError("この試技会は D スコアの入力を受け付けていません。");
  }
  if (actor.athleteId !== targetAthleteId) {
    throw new GuardError("他の選手のスコアは編集できません。");
  }
}

/** 選手が自分の E / SB まで入力できるか (ステータス open_de のときのみ)。 */
export function athleteCanEditE(competition: Competition): boolean {
  return ATHLETE_E_STATUSES.includes(competition.status);
}

/**
 * E / SB の編集可否。
 * 管理者は採点可能ステータスの間。選手は open_de の間、自分の行のみ。
 */
export function assertCanEditE(
  competition: Competition,
  actor: Actor,
  targetAthleteId?: string,
): void {
  if (actor.kind === "admin") {
    if (!ADMIN_SCORING_STATUSES.includes(competition.status)) {
      throw new GuardError(
        `現在のステータス「${STATUS_LABEL[competition.status]}」では採点入力できません。`,
      );
    }
    return;
  }
  if (!athleteCanEditE(competition)) {
    throw new GuardError("この試技会は E スコアの入力を受け付けていません。");
  }
  if (targetAthleteId && actor.athleteId !== targetAthleteId) {
    throw new GuardError("他の選手のスコアは編集できません。");
  }
}

/** 選手が試技会を閲覧できるか。draft は不可。 */
export function assertAthleteCanView(competition: Competition): void {
  if (competition.status === "draft") {
    throw new GuardError("この試技会はまだ公開されていません。");
  }
}
