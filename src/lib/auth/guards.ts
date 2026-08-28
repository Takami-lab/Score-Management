import type { Competition } from "@/lib/types";

export type Actor = { kind: "admin" } | { kind: "athlete"; athleteId: string };

export class GuardError extends Error {}

/** 選手 D スコアの編集可否。選手は open の間・自分の行のみ。管理者は常に可 (代理・上書き)。 */
export function assertCanEditD(
  competition: Competition,
  actor: Actor,
  targetAthleteId: string,
): void {
  if (actor.kind === "admin") return;
  if (competition.status !== "open") {
    throw new GuardError("この試技会は D スコアの入力を受け付けていません。");
  }
  if (actor.athleteId !== targetAthleteId) {
    throw new GuardError("他の選手のスコアは編集できません。");
  }
}

/** E / ND / SB の編集可否。管理者のみ、open または locked の間。 */
export function assertCanEditE(competition: Competition, actor: Actor): void {
  if (actor.kind !== "admin") throw new GuardError("権限がありません。");
  if (competition.status === "draft" || competition.status === "finalized") {
    throw new GuardError(
      `現在のステータス (${competition.status}) では採点入力できません。`,
    );
  }
}

/** 選手が試技会を閲覧できるか。draft は不可。 */
export function assertAthleteCanView(competition: Competition): void {
  if (competition.status === "draft") {
    throw new GuardError("この試技会はまだ公開されていません。");
  }
}
