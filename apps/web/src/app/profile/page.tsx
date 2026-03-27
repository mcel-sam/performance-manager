import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { getDevRequestContext } from "@/server/auth/request-context";
import { resolveShellViewer } from "@/server/layout/shell-context-service";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const context = await getDevRequestContext();
  const viewer = await resolveShellViewer(context);

  return (
    <WorkspacePage width="standard">
      <PageHeader
        title="Profile"
        description="Review your current account context and the workspace surfaces available in this demo build."
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
            <ProfileAvatar
              name={viewer.displayName}
              imageUrl={viewer.avatarUrl}
              size="xl"
            />
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Account overview
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  {viewer.displayName}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                  This page is intentionally lightweight for the sandbox, but it should still feel aligned with the rest of the workspace rather than like a detached stub.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{viewer.roleLabel}</Badge>
                <Badge variant="neutral">{viewer.orgName}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Manage your account, notification, and display preferences in a future release.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3">
              No editable profile fields are enabled yet.
            </div>
            <div className="rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] px-4 py-3">
              Future iterations should keep profile actions, organization context, and personal preferences here instead of pinning them into every page header.
            </div>
          </CardContent>
        </Card>
      </section>
    </WorkspacePage>
  );
}
