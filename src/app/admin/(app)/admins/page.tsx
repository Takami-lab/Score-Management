import { listAllAdmins } from "@/lib/db/queries";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminsManager } from "@/components/admins-manager";

export default async function AdminsPage() {
  const me = await requireAdmin();
  const admins = await listAllAdmins();
  return <AdminsManager admins={admins} currentId={me.id} />;
}
