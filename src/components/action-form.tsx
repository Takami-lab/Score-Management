"use client";
import * as React from "react";
import { useActionState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { ActionResult } from "@/lib/actions/result";
import { idle } from "@/lib/actions/result";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/**
 * Server Action 用フォーム。保存の成否をトーストで通知し、失敗時は再送ボタンを出す。
 */
export function ActionForm({
  action,
  children,
  className,
  successMessage = "保存しました",
  onSuccess,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, idle);
  const toast = useToast();
  const seen = React.useRef(state);

  React.useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) {
      if (state.message !== undefined || successMessage) {
        toast.push(state.message ?? successMessage, "success");
        onSuccess?.();
      }
    } else {
      toast.push(state.error, "error");
    }
  }, [state, toast, successMessage, onSuccess]);

  return (
    <form action={formAction} className={className}>
      <PendingOverlay />
      {children}
      {!state.ok && (
        <p className="mt-2 text-sm text-[var(--color-danger)]">
          {state.error}{" "}
          <ResendButton />
        </p>
      )}
    </form>
  );
}

/**
 * 送信中に画面全体を覆う「処理中…」表示。
 * 二重送信・誤タップを防ぎ、保存中であることを明確にする。
 */
function PendingOverlay() {
  const { pending } = useFormStatus();
  // pending が true になるのは送信後 = 必ずクライアント側なので SSR の心配は無い
  if (!pending || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-label="処理中"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
    >
      <div className="flex flex-col items-center gap-3 rounded-xl bg-[var(--color-surface)] px-8 py-6 shadow-2xl">
        <span className="size-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        <span className="text-sm font-medium">処理中…</span>
      </div>
    </div>,
    document.body,
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      再送
    </Button>
  );
}

export function SubmitButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? "処理中…" : children}
    </Button>
  );
}
