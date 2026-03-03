import Link from "next/link";

import UserManagementForm from "@/components/admin/user-management-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getOrgUser, listManagerCandidates } from "@/server/users/user-management-service";

interface AdminUserEditPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function AdminUserEditPage({ params }: AdminUserEditPageProps) {
  const context = await getDevRequestContext();
  const { userId } = await params;
  const [user, managerOptions] = await Promise.all([
    getOrgUser(userId, context),
    listManagerCandidates(context),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title={`Edit ${user.firstName} ${user.lastName}`}
        description="Update role, manager mapping, and profile fields."
        action={
          <Link href="/admin/users">
            <Button variant="outline">Back to users</Button>
          </Link>
        }
      />

      <UserManagementForm
        auth={{ userId: context.userId, orgId: context.orgId }}
        mode="edit"
        managerOptions={managerOptions}
        initialUser={user}
      />
    </div>
  );
}
