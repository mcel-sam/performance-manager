"use client";

import { CycleStatus } from "@prisma/client";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReviewCycleRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  peerReviewCount: number;
  upwardReviewCount: number;
}

interface ReviewCyclesTableProps {
  cycles: ReviewCycleRow[];
  auth: {
    userId: string;
    orgId: string;
  };
}

const statusBadgeVariant: Record<CycleStatus, "neutral" | "info" | "warning" | "success"> = {
  DRAFT: "neutral",
  ACTIVE: "info",
  LOCKED: "warning",
  RELEASED: "success",
};

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

      setMessage(`Generated ${payload.packetCount ?? 0} packets and ${payload.submissionCount ?? 0} submissions.`);
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cycle</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Window</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Review Mix</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((cycle) => {
                const nextStatus = transitionByStatus[cycle.status];
                const isBusy = busyCycleId === cycle.id;

                return (
                  <tr key={cycle.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{cycle.name}</p>
                      <p className="text-xs text-slate-500">{cycle.id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(cycle.startDate).toLocaleDateString()} - {" "}
                      {new Date(cycle.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant[cycle.status]}>{cycle.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      Peer: {cycle.peerReviewCount} | Upward: {cycle.upwardReviewCount}
                    </td>
                    <td className="px-4 py-3">
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {message ? <p className="px-4 pb-4 text-sm text-slate-700">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
