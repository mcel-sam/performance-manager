import Link from "next/link";

import { CycleStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { withReturnTo } from "@/lib/navigation/return-to";
import type { CalibrationSessionListItem } from "@/server/calibration/calibration-admin-service";

interface CalibrationSessionsTableProps {
  sessions: CalibrationSessionListItem[];
}

const cycleStatusBadge: Record<CycleStatus, "neutral" | "info" | "warning" | "success"> = {
  DRAFT: "neutral",
  ACTIVE: "info",
  LOCKED: "warning",
  RELEASED: "success",
};

export default function CalibrationSessionsTable({ sessions }: CalibrationSessionsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Session</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cycle</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cohort</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Participants</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{session.name}</p>
                    <p className="text-xs text-slate-500">{session.roleGroup ?? "No role group"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <p>{session.cycleName}</p>
                    <Badge variant={cycleStatusBadge[session.cycleStatus]}>{session.cycleStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{session.cohortCount}</td>
                  <td className="px-4 py-3 text-slate-700">{session.participantCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={session.isFinalized ? "warning" : "info"}>
                      {session.isFinalized ? "Finalized" : "In Progress"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={withReturnTo(
                        `/performance/calibration/${session.id}`,
                        "/admin/performance/calibration",
                      )}
                    >
                      <Button size="sm" variant="outline">
                        Open Workspace
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
