import Link from "next/link";
import { notFound } from "next/navigation";

import DemoLoginForm from "@/components/demo/demo-login-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listDemoAccountHints } from "@/server/demo/demo-auth-service";
import { isDemoModeEnabled } from "@/server/demo/demo-mode";

export default function DemoLoginPage() {
  if (!isDemoModeEnabled()) {
    notFound();
  }

  const accounts = listDemoAccountHints();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 text-slate-900">
      <PageHeader
        eyebrow="Demo Mode"
        title="Demo Login"
        description="Switch roles quickly for walkthroughs and Playwright smoke tests."
        metadata="Available only when DEMO_MODE=true in development."
        action={
          <>
            <Link href="/demo/setup">
              <Button variant="outline" size="sm">
                Open Demo Setup
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to home
              </Button>
            </Link>
          </>
        }
      />

      <DemoLoginForm accounts={accounts} />
    </div>
  );
}
