import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export const dynamic = "force-dynamic";

const relationshipLabel = {
  SELF: "Self",
  MANAGER: "Manager",
  PEER: "Peer",
  UPWARD: "Upward",
} as const;

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

export default async function PerformanceReviewsPage() {
  const context = await getDevRequestContext();
  const tasks = await listAssignedReviewTasks(context);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 text-slate-900">
      <PageHeader
        title="Performance Reviews"
        description="Track review cycles and complete your assigned submissions."
        metadata={
          <>
            Viewing as {context.role} (<code>{context.userId}</code>)
          </>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          aria-label="Empty review task state"
          title="No assigned review tasks"
          description="Assigned submissions will appear here when a cycle is generated."
        />
      ) : (
        <Card aria-label="Assigned review tasks">
          <CardContent className="p-0">
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-semibold text-slate-900">{task.cycleName}</TableCell>
                      <TableCell className="text-slate-700">{task.subjectName}</TableCell>
                      <TableCell className="text-slate-700">
                        {relationshipLabel[task.relationship]}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{statusLabel[task.status]}</Badge>
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
