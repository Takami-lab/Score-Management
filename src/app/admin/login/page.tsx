export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { listActiveAdmins } from "@/lib/db/queries";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Card, CardBody, CardTitle } from "@/components/ui";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/dashboard");
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
