import Link from "next/link";
import { notFound } from "next/navigation";

import DemoSetupPanel from "@/components/demo/demo-setup-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { isDemoModeEnabled } from "@/server/demo/demo-mode";

export default function DemoSetupPage() {
  if (!isDemoModeEnabled()) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 text-slate-900">
      <PageHeader
        eyebrow="Demo Mode"
        title="Demo Setup"
        description="Provision demo data without running scripts from the terminal."
        metadata="Use these actions to prep walkthrough data for reviews, calibration, and improvement plans."
        action={
          <>
            <Link href="/demo/login">
              <Button variant="outline" size="sm">
                Open Demo Login
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

      <DemoSetupPanel />
    </div>
  );
}
