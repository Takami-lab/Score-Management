import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { adminLogout } from "@/lib/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/admin/dashboard" className="font-semibold">
            試技会管理
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[var(--color-muted)]">{admin.name}</span>
            <form action={adminLogout}>
              <button className="min-h-9 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                ログアウト
              </button>
            </form>
          </div>
          <nav className="w-full flex items-center gap-4 overflow-x-auto">
            <Link href="/admin/dashboard" className="min-h-9 flex items-center whitespace-nowrap text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              カレンダー
            </Link>
            <Link href="/admin/athletes" className="min-h-9 flex items-center whitespace-nowrap text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              選手名簿
            </Link>
            <Link href="/admin/admins" className="min-h-9 flex items-center whitespace-nowrap text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              管理者
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
    </div>
  );
}
