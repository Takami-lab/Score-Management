import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/* ── Button ─────────────────────────────────────────── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};
export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        size === "md" ? "min-h-11 px-4 text-sm" : "min-h-9 px-3 text-sm",
        variant === "primary" &&
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
        variant === "secondary" &&
          "bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-accent)]",
        variant === "ghost" && "hover:bg-[var(--color-accent)]",
        variant === "danger" && "bg-[var(--color-danger)] text-white hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
        size === "md" ? "min-h-11 px-4 text-sm" : "min-h-9 px-3 text-sm",
        variant === "primary" &&
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
        variant === "secondary" &&
          "bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-accent)]",
        variant === "ghost" && "hover:bg-[var(--color-accent)]",
        className,
      )}
      {...props}
    />
  );
}

/* ── Input / Select / Label ─────────────────────────── */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-primary)]",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-primary)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium mb-1.5", className)}
      {...props}
    />
  );
}

/* ── Card ───────────────────────────────────────────── */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // min-w-0: grid/flex の子になったとき、中身の実寸まで広がって
        // 画面外へはみ出すのを防ぐ (内側の overflow-x-auto を効かせるため)
        "min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
      {...props}
    />
  );
}
export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-base font-semibold mb-3", className)} {...props} />
  );
}

/* ── Badge ──────────────────────────────────────────── */
export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "primary" | "warning" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-[var(--color-accent)] text-[var(--color-muted)]",
        tone === "primary" &&
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        tone === "warning" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        tone === "success" && "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
        tone === "danger" && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
        className,
      )}
      {...props}
    />
  );
}

/* ── Table ──────────────────────────────────────────── */
export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table
        className={cn("w-full text-sm border-collapse tabular", className)}
        {...props}
      />
    </div>
  );
}
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "text-left font-medium text-[var(--color-muted)] px-3 py-2 border-b border-[var(--color-border)] whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 py-2 border-b border-[var(--color-border)]", className)}
      {...props}
    />
  );
}

/* ── Provisional / status badges ────────────────────── */
export function ProvisionalBadge({ provisional }: { provisional: boolean }) {
  return provisional ? (
    <Badge tone="warning">暫定</Badge>
  ) : (
    <Badge tone="success">確定</Badge>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-[var(--color-muted)] py-8 text-center">
      {children}
    </div>
  );
}
