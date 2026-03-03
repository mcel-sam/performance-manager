import Link from "next/link";
import { ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
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
import { listAssignedReviewTasks } from "@/server/reviews/participant-review-service";

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

const statusTone = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "info",
  SUBMITTED: "success",
  RETURNED: "warning",
} as const;

export const dynamic = "force-dynamic";

export default async function TeamReviewsPage() {
  const context = await getDevRequestContext();

  if (context.role !== UserRole.MANAGER) {
    redirect("/");
  }

  const tasks = await listAssignedReviewTasks(context);
  const managerTasks = tasks.filter((task) => task.relationship === ReviewRelationship.MANAGER);
  const submittedCount = managerTasks.filter(
    (task) => task.status === ReviewSubmissionStatus.SUBMITTED,
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Team Reviews"
        description="Track direct-report manager submissions and continue pending feedback."
        metadata={`${submittedCount}/${managerTasks.length} submitted`}
      />

      {managerTasks.length === 0 ? (
        <EmptyState
          title="No manager review tasks yet"
          description="Tasks appear after HR generates submissions for your direct reports."
          icon={<span aria-hidden="true">👥</span>}
          action={
            <Link href="/performance/reviews">
              <Button variant="outline" size="sm">
                Open reviews
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Direct report submissions</CardTitle>
            <CardDescription>
              Use this list to track manager reviews and jump into open tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managerTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-semibold text-slate-900">{task.subjectName}</TableCell>
                      <TableCell className="text-slate-700">{task.cycleName}</TableCell>
                      <TableCell>
                        <StatusChip tone={statusTone[task.status]}>{statusLabel[task.status]}</StatusChip>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(task.cycleEndDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/performance/reviews/${task.cycleId}/write/${task.id}`}>
                          <Button size="sm">Open Review</Button>
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
