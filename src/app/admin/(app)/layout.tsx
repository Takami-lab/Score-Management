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
        <div className="mx-auto max-w-5xl px-4 flex items-center gap-4 h-14">
          <Link href="/admin/dashboard" className="font-semibold">
            試技会管理
          </Link>
          <Link href="/admin/dashboard" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
            カレンダー
          </Link>
          <Link href="/admin/athletes" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
            選手名簿
          </Link>
          <Link href="/admin/admins" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
            管理者
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[var(--color-muted)] hidden sm:inline">
              {admin.name}
            </span>
            <form action={adminLogout}>
              <button className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
