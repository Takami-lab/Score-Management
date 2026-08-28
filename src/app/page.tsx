import { LinkButton } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">試技会スコア管理</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        体操競技 試技会のスコア記録・集計・順位
      </p>
      <div className="mt-10 flex flex-col gap-3">
        <LinkButton href="/athlete/login" className="w-full">
          選手としてログイン
        </LinkButton>
        <LinkButton href="/admin/login" variant="secondary" className="w-full">
          管理者としてログイン
        </LinkButton>
      </div>
    </main>
  );
}
