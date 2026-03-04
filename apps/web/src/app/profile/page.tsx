import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Profile"
        description="Profile preferences are a stub in this demo build."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>
            Manage your account, notification, and display preferences in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          No editable profile fields are enabled yet.
        </CardContent>
      </Card>
    </div>
  );
}
