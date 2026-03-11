import Link from "next/link";

import { ImprovementPlanStatus } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { withReturnTo } from "@/lib/navigation/return-to";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listImprovementPlans } from "@/server/improvement-plans/improvement-plan-service";

export const dynamic = "force-dynamic";

const statusLabel: Record<ImprovementPlanStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  EXTENDED: "Extended",
  CANCELED: "Canceled",
};

export default async function ImprovementPlansListPage() {
  const context = await getDevRequestContext();
  const plans = await listImprovementPlans(context);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Improvement Plans"
        title="Coaching plans and check-ins"
        description="Track active plans, due timelines, and status progress."
      />

      {plans.length === 0 ? (
        <EmptyState
          title="No improvement plans yet"
          description="Plans created by managers or HR appear here. Use the help center for setup guidance."
          action={
            <Link
              href="/help"
              className="text-sm font-medium text-slate-700 underline underline-offset-4 transition hover:text-slate-900"
            >
              Review help center
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-semibold text-slate-900">{plan.title}</TableCell>
                      <TableCell className="text-slate-700">{plan.subjectName}</TableCell>
                      <TableCell className="text-slate-700">{plan.managerName}</TableCell>
                      <TableCell>
                        <Badge variant="neutral">{statusLabel[plan.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(plan.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={withReturnTo(
                            `/performance/improvement-plans/${plan.id}`,
                            "/performance/improvement-plans",
                          )}
                        >
                          <Button size="sm">Open Plan</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
