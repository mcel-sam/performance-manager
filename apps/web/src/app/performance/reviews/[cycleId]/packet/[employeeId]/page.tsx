import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/performance/reviews">
              <Button variant="outline" className="w-full justify-start">
                Review Tasks
              </Button>
            </Link>
            <p className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              Packet View
            </p>
          </CardContent>
        </Card>

        <ReviewPacketView data={packet} />
      </div>
    </div>
  );
}
