import Link from "next/link";
import { redirect } from "next/navigation";

import UserManagementTable from "@/components/admin/user-management-table";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionContainer } from "@/components/ui/section-container";
import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listOrgUsers } from "@/server/users/user-management-service";

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const context = await getDevRequestContext();
  if (!hasHrAdminAccess(context.role)) {
    redirect("/");
  }
  const { search } = await searchParams;
  const directory = await listOrgUsers(context, { search });

  return (
    <WorkspacePage width="wide" className="flex flex-col gap-6">
      <PageHeader
        title="User Management"
        description="Manage roles and org structure so assignments and reporting stay aligned."
        action={
          <Link href="/admin/users/new">
            <Button data-testid="admin-users-add-user">Add User</Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-5">
        <SummaryCard label="Total users" value={directory.summary.totalUsers} />
        <SummaryCard label="HR admins" value={directory.summary.hrAdmins} />
        <SummaryCard label="Super admins" value={directory.summary.superAdmins} />
        <SummaryCard label="Managers" value={directory.summary.managers} />
        <SummaryCard label="Employees" value={directory.summary.employees} />
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search users</CardTitle>
          <CardDescription>Filter by first name, last name, or email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-center gap-2" method="GET">
            <Input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search name or email"
              className="max-w-lg"
              data-testid="admin-users-search-input"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
            <Link href="/admin/users">
              <Button type="button" variant="outline">
                Clear
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>

      {directory.users.length === 0 ? (
        <EmptyState
          title="No users matched this search"
          description="Try a broader search or create a new user profile."
          action={
            <Link href="/admin/users/new">
              <Button size="sm">Add User</Button>
            </Link>
          }
        />
      ) : (
        <SectionContainer variant="brand" className="p-3">
          <UserManagementTable users={directory.users} />
        </SectionContainer>
      )}
    </WorkspacePage>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
