import SandboxLoginForm from "@/components/auth/sandbox-login-form";
import { PageHeader } from "@/components/layout/page-header";
import DemoLoginPanel from "@/components/demo/demo-login-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appEnv } from "@/config/env";
import { isDemoModeEnabled } from "@/server/demo/demo-mode";
import { listDemoRoleTiles } from "@/server/demo/demo-auth-service";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const demoEnabled = isDemoModeEnabled();
  const supabaseEnabled = appEnv.supabaseConfigured;
  const roleTiles = demoEnabled ? listDemoRoleTiles() : [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Performance Manager"
        title={supabaseEnabled ? "Sign in to Trellis" : "Local access"}
        description={
          supabaseEnabled
            ? "Use your sandbox account to access Trellis with server-owned session identity."
            : "Supabase sandbox auth is not configured. Local demo shortcuts remain available only in development."
        }
        metadata={
          supabaseEnabled
            ? "Sandbox auth is enabled."
            : "Set Supabase auth env vars to enable sandbox sign in."
        }
      />

      {supabaseEnabled ? <SandboxLoginForm /> : null}

      {demoEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Developer-only demo access</CardTitle>
            <CardDescription>
              Local role switching remains available only in development. Do not use this as
              the shared sandbox auth path.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemoLoginPanel demoEnabled={demoEnabled} roleTiles={roleTiles} />
          </CardContent>
        </Card>
      ) : null}

      {!supabaseEnabled && !demoEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Auth is not configured</CardTitle>
            <CardDescription>
              Trellis needs Supabase sandbox auth or local demo mode before this environment can
              be used interactively.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
