import Link from "next/link";

import UserManagementForm from "@/components/admin/user-management-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listManagerCandidates } from "@/server/users/user-management-service";

export const dynamic = "force-dynamic";

export default async function AdminUserCreatePage() {
  const context = await getDevRequestContext();
  const managerOptions = await listManagerCandidates(context);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Add User"
        description="Create a new user profile and map role + manager hierarchy."
        action={
          <Link href="/admin/users">
            <Button variant="outline">Back to users</Button>
          </Link>
        }
      />

      <UserManagementForm
        auth={{ userId: context.userId, orgId: context.orgId }}
        mode="create"
        managerOptions={managerOptions}
      />
    </div>
  );
}
