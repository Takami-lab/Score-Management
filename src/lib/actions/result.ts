export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export const idle: ActionResult = { ok: true };

export function fail(error: string): ActionResult {
  return { ok: false, error };
}
export function ok(message?: string): ActionResult {
  return { ok: true, message };
}
