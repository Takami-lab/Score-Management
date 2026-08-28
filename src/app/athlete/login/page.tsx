export const dynamic = "force-dynamic";

import { listActiveAthletes } from "@/lib/db/queries";
import { AthleteLoginForm } from "@/components/athlete-login-form";
import { Card, CardBody, CardTitle } from "@/components/ui";

export default async function AthleteLoginPage() {
  const athletes = await listActiveAthletes();
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Card>
        <CardBody>
          <CardTitle>選手ログイン</CardTitle>
          <p className="text-sm text-[var(--color-muted)] mb-4">
            名簿から自分を選んでください。
          </p>
          <AthleteLoginForm athletes={athletes} />
        </CardBody>
      </Card>
    </main>
  );
}
