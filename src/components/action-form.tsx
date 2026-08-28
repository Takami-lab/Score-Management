"use client";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
