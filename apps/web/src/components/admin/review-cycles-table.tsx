"use client";

import { CycleStatus } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCycleStatusTone, StatusChip } from "@/components/ui/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { Toast } from "@/components/ui/toast";

interface ReviewCycleRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  peerReviewCount: number;
  upwardReviewCount: number;
  selfReviewDueAt: string | null;
  managerReviewDueAt: string | null;
  peerReviewDueAt: string | null;
  upwardReviewDueAt: string | null;
  submissionStatusCounts: {
    NOT_STARTED: number;
    IN_PROGRESS: number;
    SUBMITTED: number;
    RETURNED: number;
  };
  submissionRelationshipCounts: {
    SELF: number;
    MANAGER: number;
    PEER: number;
    UPWARD: number;
  };
}

interface ReviewCyclesTableProps {
  cycles: ReviewCycleRow[];
  auth: {
    userId: string;
    orgId: string;
  };
}

const transitionByStatus: Partial<Record<CycleStatus, CycleStatus>> = {
  DRAFT: CycleStatus.ACTIVE,
  ACTIVE: CycleStatus.LOCKED,
  LOCKED: CycleStatus.RELEASED,
};

export default function ReviewCyclesTable({ cycles, auth }: ReviewCyclesTableProps) {
  const [rows, setRows] = useState(cycles);
  const [busyCycleId, setBusyCycleId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate(cycleId: string) {
    setBusyCycleId(cycleId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/performance/review-cycles/${cycleId}/generate`, {
        method: "POST",
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to generate cycle artifacts");
      }

      setMessage(
        `Generated ${payload.submissionCount ?? 0} submissions for ${
          payload.packetCount ?? 0
        } review bundles.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate cycle artifacts");
    } finally {
      setBusyCycleId(null);
    }
  }

  async function handleTransition(cycleId: string, currentStatus: CycleStatus) {
    const targetStatus = transitionByStatus[currentStatus];
    if (!targetStatus) {
      return;
    }

    setBusyCycleId(cycleId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/performance/review-cycles/${cycleId}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          targetStatus,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to transition cycle status");
      }

      setRows((previous) =>
        previous.map((row) =>
          row.id === cycleId
            ? {
                ...row,
                status: payload.status,
              }
            : row,
        ),
      );
      setMessage(`Cycle moved to ${payload.status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to transition cycle status");
    } finally {
      setBusyCycleId(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-0">
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Mix</TableHead>
                <TableHead>Progress Summary</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((cycle) => {
                const nextStatus = transitionByStatus[cycle.status];
                const isBusy = busyCycleId === cycle.id;

                return (
                  <TableRow key={cycle.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{cycle.name}</p>
                      <p className="text-xs text-slate-500">{cycle.id}</p>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {new Date(cycle.startDate).toLocaleDateString()} -{" "}
                      {new Date(cycle.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusChip tone={getCycleStatusTone(cycle.status)}>{cycle.status}</StatusChip>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      Peer: {cycle.peerReviewCount} | Upward: {cycle.upwardReviewCount}
                      <p className="mt-1 text-xs text-slate-500">
                        Self due: {formatDueDate(cycle.selfReviewDueAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Manager due: {formatDueDate(cycle.managerReviewDueAt)}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <p>
                        Status: NS {cycle.submissionStatusCounts.NOT_STARTED} / IP{" "}
                        {cycle.submissionStatusCounts.IN_PROGRESS} / SUB{" "}
                        {cycle.submissionStatusCounts.SUBMITTED}
                      </p>
                      <p>
                        Types: Self {cycle.submissionRelationshipCounts.SELF} / Manager{" "}
                        {cycle.submissionRelationshipCounts.MANAGER} / Peer{" "}
                        {cycle.submissionRelationshipCounts.PEER} / Upward{" "}
                        {cycle.submissionRelationshipCounts.UPWARD}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy || cycle.status !== CycleStatus.DRAFT}
                          onClick={() => void handleGenerate(cycle.id)}
                        >
                          {isBusy ? "Working..." : "Generate"}
                        </Button>
                        <Button
                          size="sm"
                          disabled={isBusy || !nextStatus}
                          onClick={() => void handleTransition(cycle.id, cycle.status)}
                        >
                          {nextStatus ? `Move to ${nextStatus}` : "Final"}
                        </Button>
                        <Link href={`/admin/performance/reporting?cycleId=${cycle.id}&tab=progress`}>
                          <Button size="sm" variant="outline">
                            Reporting
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>

        {message ? (
          <Toast
            variant={message.toLowerCase().includes("unable") ? "error" : "success"}
            className="mx-4 mb-4"
          >
            {message}
          </Toast>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDueDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}
