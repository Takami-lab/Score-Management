export const dynamic = "force-dynamic";

import { listActiveAdmins } from "@/lib/db/queries";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Card, CardBody, CardTitle } from "@/components/ui";

export default async function AdminLoginPage() {
  const admins = await listActiveAdmins();
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Card>
        <CardBody>
          <CardTitle>管理者ログイン</CardTitle>
          <p className="text-sm text-[var(--color-muted)] mb-4">
            一覧から自分を選び、共通パスワードを入力してください。
          </p>
          <AdminLoginForm admins={admins} />
        </CardBody>
      </Card>
    </main>
  );
}
