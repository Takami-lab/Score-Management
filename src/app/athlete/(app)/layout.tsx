import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { athleteLogout } from "@/lib/actions/auth";
import { athleteLabel } from "@/lib/types";

export default async function AthleteAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/athlete/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-3xl px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/athlete/competitions" className="font-semibold">
            試技会
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[var(--color-muted)]">
              {athleteLabel(athlete)}
            </span>
            <form action={athleteLogout}>
              <button className="min-h-9 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                ログアウト
              </button>
            </form>
          </div>
          <nav className="w-full min-w-0 flex items-center gap-4 overflow-x-auto">
            <Link
              href="/athlete/competitions"
              className="min-h-9 flex items-center whitespace-nowrap text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              試技会一覧
            </Link>
            <Link
              href="/athlete/progress"
              className="min-h-9 flex items-center whitespace-nowrap text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              得点推移
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
