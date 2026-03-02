import { PageHeader } from "@/components/layout/page-header";
import DemoLoginPanel from "@/components/demo/demo-login-panel";
import { isDemoModeEnabled } from "@/server/demo/demo-mode";
import { listDemoRoleTiles } from "@/server/demo/demo-auth-service";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const demoEnabled = isDemoModeEnabled();
  const roleTiles = demoEnabled ? listDemoRoleTiles() : [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Performance Manager"
        title="Demo login"
        description="Sign in by role and optionally reset sample data for walkthroughs."
        metadata={
          demoEnabled
            ? "Demo mode is enabled (development only)."
            : "Demo mode is disabled. Set DEMO_MODE=true in development to enable role login."
        }
      />

      <DemoLoginPanel demoEnabled={demoEnabled} roleTiles={roleTiles} />
    </div>
  );
}
