import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/ui/help-hint";
import { getCycleStatusTone, StatusChip } from "@/components/ui/status-chip";
import ReviewPacketView from "@/components/reviews/review-packet-view";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getReviewPacket } from "@/server/reviews/review-packet-service";

export const dynamic = "force-dynamic";

interface ReviewPacketPageProps {
  params: Promise<{
    cycleId: string;
    employeeId: string;
  }>;
}

export default async function ReviewPacketPage({ params }: ReviewPacketPageProps) {
  const { cycleId, employeeId } = await params;
  const context = await getDevRequestContext();
  const packet = await getReviewPacket(cycleId, employeeId, context);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 text-slate-900">
      <PageHeader
        eyebrow="Review Packet"
        title={packet.packet.subjectName}
        description={`${packet.packet.cycleName} · ${packet.packet.submittedCount} of ${packet.packet.totalSubmissions} submitted`}
        metadata={
          <>
            Status: {packet.packet.cycleStatus} | Visibility: {packet.packet.visibilityPolicy}
          </>
        }
      />

      <HelpHint
        label="Packet visibility"
        buttonLabel="Toggle review packet visibility guidance"
      >
        Managers and HR can view in-progress packets. Employees can view packet content after
        release when cycle policy allows.
      </HelpHint>

      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 shadow-[var(--shadow-xs)]">
        <Link href="/performance/reviews">
          <Button variant="outline" size="sm">
            Back to Reviews
          </Button>
        </Link>
        <StatusChip tone={getCycleStatusTone(packet.packet.cycleStatus)}>
          Cycle {packet.packet.cycleStatus}
        </StatusChip>
        <span className="text-xs text-slate-500">Packet focus view</span>
      </div>

      <ReviewPacketView data={packet} />
    </div>
  );
}
