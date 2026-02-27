"use client";

import { CalibrationBucket } from "@prisma/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import type {
  CalibrationAxisDefinition,
  CalibrationSessionData,
} from "@/server/calibration/calibration-session-service";

const performanceOrder: CalibrationBucket[] = [
  CalibrationBucket.LOW,
  CalibrationBucket.MEDIUM,
  CalibrationBucket.HIGH,
];

const potentialOrder: CalibrationBucket[] = [
  CalibrationBucket.HIGH,
  CalibrationBucket.MEDIUM,
  CalibrationBucket.LOW,
];

type DrawerTab = "thisCycle" | "previousCycles";

interface CalibrationSessionViewProps {
  sessionId: string;
  auth: {
    userId: string;
    orgId: string;
  };
  initialData: CalibrationSessionData;
}

export default function CalibrationSessionView({
  sessionId,
  auth,
  initialData,
}: CalibrationSessionViewProps) {
  const [session, setSession] = useState(initialData.session);
  const [placements, setPlacements] = useState(initialData.placements);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    initialData.placements[0]?.employeeId ?? null,
  );
  const [selectedTab, setSelectedTab] = useState<DrawerTab>("thisCycle");
  const [movePerformanceBucket, setMovePerformanceBucket] = useState<CalibrationBucket>(
    initialData.placements[0]?.performanceBucket ?? CalibrationBucket.MEDIUM,
  );
  const [movePotentialBucket, setMovePotentialBucket] = useState<CalibrationBucket>(
    initialData.placements[0]?.potentialBucket ?? CalibrationBucket.MEDIUM,
  );
  const [moveMessage, setMoveMessage] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const performanceLabels = useMemo(
    () => buildAxisLabelMap(initialData.guidance.performance),
    [initialData.guidance.performance],
  );

  const potentialLabels = useMemo(
    () => buildAxisLabelMap(initialData.guidance.potential),
    [initialData.guidance.potential],
  );

  const selectedPlacement = useMemo(
    () => placements.find((placement) => placement.employeeId === selectedEmployeeId) ?? null,
    [placements, selectedEmployeeId],
  );

  const placementsByCell = useMemo(() => {
    const map = new Map<string, CalibrationSessionData["placements"]>();

    for (const placement of placements) {
      const key = makeCellKey(placement.performanceBucket, placement.potentialBucket);
      const existing = map.get(key) ?? [];
      existing.push(placement);
      map.set(key, existing);
    }

    return map;
  }, [placements]);

  useEffect(() => {
    if (!selectedPlacement) {
      return;
    }

    setMovePerformanceBucket(selectedPlacement.performanceBucket);
    setMovePotentialBucket(selectedPlacement.potentialBucket);
    setMoveMessage(null);
  }, [selectedPlacement]);

  async function handleMovePlacement() {
    if (!selectedPlacement || session.isFinalized) {
      return;
    }

    setIsMoving(true);
    setMoveMessage(null);

    try {
      const response = await fetch(
        `/api/performance/calibration/${sessionId}/placements/${selectedPlacement.employeeId}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-user-id": auth.userId,
            "x-org-id": auth.orgId,
          },
          body: JSON.stringify({
            performanceBucket: movePerformanceBucket,
            potentialBucket: movePotentialBucket,
          }),
        },
      );

      const payload = (await response.json()) as {
        message?: string;
        performanceBucket?: CalibrationBucket;
        potentialBucket?: CalibrationBucket;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to move placement");
      }

      setPlacements((previous) =>
        previous.map((placement) =>
          placement.employeeId === selectedPlacement.employeeId
            ? {
                ...placement,
                performanceBucket: payload.performanceBucket ?? placement.performanceBucket,
                potentialBucket: payload.potentialBucket ?? placement.potentialBucket,
              }
            : placement,
        ),
      );
      setMoveMessage("Placement updated.");
    } catch (error) {
      setMoveMessage(error instanceof Error ? error.message : "Unable to move placement");
    } finally {
      setIsMoving(false);
    }
  }

  async function handleFinalizeSession() {
    if (session.isFinalized || !initialData.viewer.canFinalize) {
      return;
    }

    setIsFinalizing(true);
    setFinalizeMessage(null);

    try {
      const response = await fetch(`/api/performance/calibration/${sessionId}/finalize`, {
        method: "POST",
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
      });

      const payload = (await response.json()) as {
        message?: string;
        finalizedAt?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to finalize session");
      }

      setSession((previous) => ({
        ...previous,
        isFinalized: true,
        finalizedAt: payload.finalizedAt ?? previous.finalizedAt,
      }));
      setPlacements((previous) =>
        previous.map((placement) => ({
          ...placement,
          canMove: false,
        })),
      );
      setFinalizeMessage("Calibration finalized. Placements are now locked.");
      setMoveMessage(null);
    } catch (error) {
      setFinalizeMessage(error instanceof Error ? error.message : "Unable to finalize session");
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calibration Session"
        title={session.name}
        description={initialData.guidance.summary}
        action={
          !session.isFinalized && initialData.viewer.canFinalize ? (
            <Button onClick={() => void handleFinalizeSession()} disabled={isFinalizing}>
              {isFinalizing ? "Finalizing..." : "Finalize Session"}
            </Button>
          ) : null
        }
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{session.cycleName}</Badge>
            {session.isFinalized ? (
              <Badge variant="warning">Finalized</Badge>
            ) : (
              <Badge variant="neutral">In progress</Badge>
            )}
            {session.finalizedAt ? (
              <span className="text-xs text-slate-500">
                Finalized on {new Date(session.finalizedAt).toLocaleString()}
              </span>
            ) : null}
          </div>
        }
      />

      {finalizeMessage ? (
        <Toast variant={finalizeMessage.includes("Unable") ? "error" : "success"}>
          {finalizeMessage}
        </Toast>
      ) : null}

      <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <details className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-medium text-slate-900">Performance definitions</summary>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {initialData.guidance.performance.map((definition) => (
              <li key={definition.bucket}>
                <span className="font-semibold text-slate-800">{definition.label}:</span>{" "}
                {definition.description}
              </li>
            ))}
          </ul>
        </details>
        <details className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-medium text-slate-900">Potential definitions</summary>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {initialData.guidance.potential.map((definition) => (
              <li key={definition.bucket}>
                <span className="font-semibold text-slate-800">{definition.label}:</span>{" "}
                {definition.description}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {session.isFinalized ? (
        <Toast variant="warning">This session is finalized. Placements are read-only.</Toast>
      ) : null}

      {placements.length === 0 ? (
        <EmptyState
          title="No cohort members yet"
          description="Populate this session with employees and initial placements to start calibration."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <Card>
              <CardHeader>
                <SectionHeader
                  title="9-box matrix"
                  description="Select a cohort member to view packet context and adjust placement."
                />
              </CardHeader>
              <CardContent className="pt-0">
                <TableWrapper className="rounded-[var(--radius-lg)] border border-slate-200">
                  <Table className="min-w-[920px] border-collapse">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40 border-b border-r border-slate-200 bg-slate-50">
                          Potential \ Performance
                        </TableHead>
                        {performanceOrder.map((performanceBucket) => (
                          <TableHead
                            key={performanceBucket}
                            className="w-72 border-b border-slate-200 bg-slate-50"
                          >
                            {performanceLabels[performanceBucket]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {potentialOrder.map((potentialBucket) => (
                        <TableRow key={potentialBucket}>
                          <th className="border-r border-t border-slate-200 bg-slate-50 px-4 py-4 align-top text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {potentialLabels[potentialBucket]}
                          </th>
                          {performanceOrder.map((performanceBucket) => {
                            const key = makeCellKey(performanceBucket, potentialBucket);
                            const cellPlacements = placementsByCell.get(key) ?? [];

                            return (
                              <td key={key} className="border-t border-slate-200 p-4 align-top">
                                {cellPlacements.length === 0 ? (
                                  <p className="text-xs text-slate-400">No members</p>
                                ) : (
                                  <div className="space-y-2">
                                    {cellPlacements.map((placement) => {
                                      const isSelected = placement.employeeId === selectedEmployeeId;

                                      return (
                                        <button
                                          key={placement.placementId}
                                          type="button"
                                          aria-label={`Select ${placement.employeeName} placement`}
                                          onClick={() => setSelectedEmployeeId(placement.employeeId)}
                                          className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
                                            isSelected
                                              ? "border-slate-900 bg-slate-900 text-white"
                                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                                          }`}
                                        >
                                          <p className="font-medium">{placement.employeeName}</p>
                                          <p
                                            className={`text-xs ${
                                              isSelected ? "text-slate-200" : "text-slate-500"
                                            }`}
                                          >
                                            {placement.managerName
                                              ? `Manager: ${placement.managerName}`
                                              : "No manager assigned"}
                                          </p>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>
          </section>

          <Drawer title="Participant Context" description="Open packet context and adjust placement.">
            {!selectedPlacement ? (
              <EmptyState
                title="No participant selected"
                description="Select a cohort member from the matrix to view details."
                className="p-4"
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedPlacement.employeeName}</h2>
                  <p className="text-sm text-slate-600">
                    {selectedPlacement.managerName
                      ? `Manager: ${selectedPlacement.managerName}`
                      : "No manager assigned"}
                  </p>
                </div>

                <Tabs
                  ariaLabel="Calibration drawer tabs"
                  value={selectedTab}
                  onValueChange={(nextValue) => setSelectedTab(nextValue as DrawerTab)}
                  tabs={[
                    { value: "thisCycle", label: "This cycle" },
                    { value: "previousCycles", label: "Previous cycles" },
                  ]}
                />

                {selectedTab === "thisCycle" ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="space-y-1">
                        <CardTitle className="text-base">Packet summary</CardTitle>
                        <CardDescription>
                          {selectedPlacement.packetSummary.submittedCount} of{" "}
                          {selectedPlacement.packetSummary.totalSubmissions} submissions completed.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Link href={`/performance/reviews/${session.cycleId}/packet/${selectedPlacement.employeeId}`}>
                          <Button variant="outline" size="sm">
                            Open review packet
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="space-y-1">
                        <CardTitle className="text-base">Move to box</CardTitle>
                        <CardDescription>
                          Set performance and potential buckets for this participant.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <label className="block space-y-1 text-sm font-medium text-slate-700">
                          <span>Performance</span>
                          <Select
                            value={movePerformanceBucket}
                            onChange={(event) =>
                              setMovePerformanceBucket(event.target.value as CalibrationBucket)
                            }
                            disabled={!selectedPlacement.canMove || session.isFinalized}
                          >
                            {performanceOrder.map((bucket) => (
                              <option key={bucket} value={bucket}>
                                {performanceLabels[bucket]}
                              </option>
                            ))}
                          </Select>
                        </label>

                        <label className="block space-y-1 text-sm font-medium text-slate-700">
                          <span>Potential</span>
                          <Select
                            value={movePotentialBucket}
                            onChange={(event) =>
                              setMovePotentialBucket(event.target.value as CalibrationBucket)
                            }
                            disabled={!selectedPlacement.canMove || session.isFinalized}
                          >
                            {potentialOrder.map((bucket) => (
                              <option key={bucket} value={bucket}>
                                {potentialLabels[bucket]}
                              </option>
                            ))}
                          </Select>
                        </label>

                        <Button
                          onClick={() => void handleMovePlacement()}
                          disabled={isMoving || !selectedPlacement.canMove || session.isFinalized}
                          className="w-full"
                        >
                          {isMoving ? "Updating..." : "Update placement"}
                        </Button>

                        {!selectedPlacement.canMove && !session.isFinalized ? (
                          <Toast variant="warning">
                            You can only move placements for employees you manage.
                          </Toast>
                        ) : null}

                        {moveMessage ? (
                          <Toast variant={moveMessage.includes("Unable") ? "error" : "success"}>
                            {moveMessage}
                          </Toast>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <EmptyState
                    title="No previous-cycle calibration data"
                    description="Previous cycle comparisons will appear here when historical sessions are available."
                    className="p-4"
                  />
                )}
              </div>
            )}
          </Drawer>
        </div>
      )}
    </div>
  );
}

function buildAxisLabelMap(definitions: CalibrationAxisDefinition[]) {
  return definitions.reduce(
    (accumulator, definition) => {
      accumulator[definition.bucket] = definition.label;
      return accumulator;
    },
    {
      [CalibrationBucket.LOW]: "Low",
      [CalibrationBucket.MEDIUM]: "Medium",
      [CalibrationBucket.HIGH]: "High",
    } as Record<CalibrationBucket, string>,
  );
}

function makeCellKey(performanceBucket: CalibrationBucket, potentialBucket: CalibrationBucket) {
  return `${performanceBucket}:${potentialBucket}`;
}
