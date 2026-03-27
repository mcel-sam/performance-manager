import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/ui/help-hint";
import { getCycleStatusTone, StatusChip } from "@/components/ui/status-chip";
import { getBackLabelForHref, resolveReturnTo } from "@/lib/navigation/return-to";
import ReviewPacketView from "@/components/reviews/review-packet-view";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getReviewPacket } from "@/server/reviews/review-packet-service";

export const dynamic = "force-dynamic";

interface ReviewPacketPageProps {
  params: Promise<{
    cycleId: string;
    employeeId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReviewPacketPage({
  params,
  searchParams,
}: ReviewPacketPageProps) {
  const { cycleId, employeeId } = await params;
  const rawSearchParams = await searchParams;
  const context = await getDevRequestContext();
  const packet = await getReviewPacket(cycleId, employeeId, context);
  const returnHref = resolveReturnTo(getSingleValue(rawSearchParams.returnTo), "/performance/reviews");
  const returnLabel = getBackLabelForHref(returnHref, "Back");

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
        Review packets aggregate the self review and direct-manager review only. Direct managers can
        view in-progress packets for their reports, and employees can view packet content after
        release when cycle policy allows.
      </HelpHint>

      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 shadow-[var(--shadow-xs)]">
        <Link href={returnHref}>
          <Button variant="outline" size="sm">
            {returnLabel}
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

function getSingleValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
