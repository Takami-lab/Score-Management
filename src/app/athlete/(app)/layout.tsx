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
        <div className="mx-auto max-w-3xl px-4 flex items-center gap-3 h-14">
          <Link href="/athlete/competitions" className="font-semibold">
            試技会
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[var(--color-muted)]">
              {athleteLabel(athlete)}
            </span>
            <form action={athleteLogout}>
              <button className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
