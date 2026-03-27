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
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { formatStableDateTime } from "@/lib/dates/stable-format";
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
  const [downstreamOutputs, setDownstreamOutputs] = useState(initialData.downstreamOutputs);
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
  const [placementNote, setPlacementNote] = useState(
    initialData.placements[0]?.justificationNote ?? "",
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
    setPlacementNote(selectedPlacement.justificationNote ?? "");
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
            justificationNote: placementNote.trim().length > 0 ? placementNote.trim() : null,
          }),
        },
      );

      const payload = (await response.json()) as {
        message?: string;
        performanceBucket?: CalibrationBucket;
        potentialBucket?: CalibrationBucket;
        justificationNote?: string | null;
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
                justificationNote:
                  payload.justificationNote === undefined
                    ? placement.justificationNote
                    : payload.justificationNote,
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
        downstreamOutputs?: CalibrationSessionData["downstreamOutputs"];
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
      if (payload.downstreamOutputs) {
        setDownstreamOutputs(payload.downstreamOutputs);
      }
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
          <div className="flex flex-wrap items-center gap-2">
            {!session.isFinalized && initialData.viewer.canFinalize ? (
              <Button onClick={() => void handleFinalizeSession()} disabled={isFinalizing}>
                {isFinalizing ? "Finalizing..." : "Finalize Session"}
              </Button>
            ) : null}
          </div>
        }
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{session.cycleName}</Badge>
            {session.isRestricted ? <Badge variant="warning">Restricted cohort</Badge> : null}
            {session.isFinalized ? (
              <Badge variant="warning">Finalized</Badge>
            ) : (
              <Badge variant="neutral">In progress</Badge>
            )}
            {session.finalizedAt ? (
              <span className="text-xs text-slate-500">
                Finalized on {formatStableDateTime(session.finalizedAt)}
              </span>
            ) : null}
          </div>
        }
      />

      <Toast variant="info">
        {session.isRestricted
          ? "This restricted calibration session is reserved for Super Admin review of leadership or sensitive talent cohorts."
          : "Calibration aligns reviewers on performance and potential placements for this cycle before outcomes are finalized."}
      </Toast>

      {finalizeMessage ? (
        <Toast variant={finalizeMessage.includes("Unable") ? "error" : "success"}>
          {finalizeMessage}
        </Toast>
      ) : null}

      <HelpHint
        label="What finalized/locked means"
        buttonLabel="Toggle finalized and locked guidance"
      >
        Finalizing captures an immutable snapshot and locks placement controls. Context links remain
        viewable after lock, and Super Admin downstream succession/risk outputs become available from
        the finalized snapshot.
      </HelpHint>

      {initialData.viewer.canViewDownstreamOutputs ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <SectionHeader
                title="Succession outputs"
                description={
                  downstreamOutputs.available
                    ? "Recommended succession follow-up from the finalized calibration snapshot."
                    : "Finalize the session to capture restricted succession outputs."
                }
              />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {downstreamOutputs.available && downstreamOutputs.succession ? (
                <>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <Badge variant="info">
                      Emergency backup {downstreamOutputs.succession.emergencyBackupCount}
                    </Badge>
                    <Badge variant="info">
                      Ready now {downstreamOutputs.succession.readyNowCount}
                    </Badge>
                    <Badge variant="info">
                      Ready future {downstreamOutputs.succession.readyFutureCount}
                    </Badge>
                  </div>
                  {downstreamOutputs.succession.candidates.length === 0 ? (
                    <EmptyState
                      title="No successor signals yet"
                      description="No cohort members currently meet the downstream succession thresholds from this finalized calibration."
                      className="p-4"
                    />
                  ) : (
                    <div className="space-y-2">
                      {downstreamOutputs.succession.candidates.map((candidate) => (
                        <div
                          key={candidate.employeeId}
                          className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3"
                        >
                          <p className="text-sm font-semibold text-slate-900">{candidate.employeeName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {candidate.emergencyBackup
                              ? "Emergency backup"
                              : candidate.readyNow
                                ? "Ready now"
                                : "Ready future"}{" "}
                            · {candidate.estimatedReadinessTimeframe}
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {candidate.developmentNeeds ?? "No development note captured in this placement."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No finalized succession outputs"
                  description="Succession outputs are derived only from the finalized calibration snapshot."
                  className="p-4"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader
                title="Risk outputs"
                description={
                  downstreamOutputs.available
                    ? "Restricted risk follow-up derived from the finalized calibration snapshot."
                    : "Finalize the session to capture restricted risk outputs."
                }
              />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {downstreamOutputs.available && downstreamOutputs.risk ? (
                <>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <Badge variant="warning">
                      Organizational risk {downstreamOutputs.risk.organizationalRiskLevel}
                    </Badge>
                    <Badge variant="warning">
                      Flagged follow-ups {downstreamOutputs.risk.flaggedCount}
                    </Badge>
                  </div>
                  {downstreamOutputs.risk.items.length === 0 ? (
                    <EmptyState
                      title="No restricted risk flags"
                      description="No cohort members currently require restricted risk follow-up from this finalized calibration."
                      className="p-4"
                    />
                  ) : (
                    <div className="space-y-2">
                      {downstreamOutputs.risk.items.map((item) => (
                        <div
                          key={item.employeeId}
                          className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3"
                        >
                          <p className="text-sm font-semibold text-slate-900">{item.employeeName}</p>
                          <p className="mt-1 text-xs text-slate-500">Risk level {item.riskLevel}</p>
                          <p className="mt-2 text-sm text-slate-700">{item.issueSummary}</p>
                          <p className="mt-2 text-sm font-medium text-slate-600">
                            {item.actionRecommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No finalized risk outputs"
                  description="Risk outputs are reserved for restricted Super Admin follow-up after finalization."
                  className="p-4"
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <HelpHint label="Performance definitions" buttonLabel="Toggle performance definitions">
          <ul className="space-y-1">
            {initialData.guidance.performance.map((definition) => (
              <li key={definition.bucket}>
                <span className="font-semibold text-slate-800">{definition.label}:</span>{" "}
                {definition.description}
              </li>
            ))}
          </ul>
        </HelpHint>
        <HelpHint label="Potential definitions" buttonLabel="Toggle potential definitions">
          <ul className="space-y-1">
            {initialData.guidance.potential.map((definition) => (
              <li key={definition.bucket}>
                <span className="font-semibold text-slate-800">{definition.label}:</span>{" "}
                {definition.description}
              </li>
            ))}
          </ul>
        </HelpHint>
      </div>

      {session.isFinalized ? (
        <Toast variant="warning">This session is finalized. Placements are read-only.</Toast>
      ) : null}

      {placements.length === 0 ? (
        <EmptyState
          title="No cohort members yet"
          description="Populate this session with employees and initial placements to start calibration."
          action={
            <Link href="/admin/performance/calibration">
              <Button size="sm" variant="outline">
                Open calibration admin
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <Card>
              <CardHeader>
                <SectionHeader
                  title="9-box matrix"
                  description="Select a cohort member to view context and adjust placement."
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
                                          data-testid={`calibration-placement-${placement.employeeId}`}
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

          <Drawer title="Participant Context" description="Review participant context and adjust placement.">
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
                        <CardTitle className="text-base">Submission summary</CardTitle>
                        <CardDescription>
                          {selectedPlacement.packetSummary.submittedCount} of{" "}
                          {selectedPlacement.packetSummary.totalSubmissions} submissions completed.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0" />
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
                            data-testid="calibration-performance-select"
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
                            data-testid="calibration-potential-select"
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

                        <label className="block space-y-1 text-sm font-medium text-slate-700">
                          <span>Justification notes</span>
                          <Textarea
                            value={placementNote}
                            onChange={(event) => setPlacementNote(event.target.value)}
                            placeholder="Capture rationale for this placement..."
                            className="min-h-24"
                            disabled={!selectedPlacement.canMove || session.isFinalized}
                          />
                        </label>

                        <Button
                          onClick={() => void handleMovePlacement()}
                          disabled={isMoving || !selectedPlacement.canMove || session.isFinalized}
                          className="w-full"
                          data-testid="calibration-save-placement"
                        >
                          {isMoving ? "Updating..." : "Save placement"}
                        </Button>

                        {!selectedPlacement.canMove && !session.isFinalized ? (
                          <Toast variant="warning">
                            Manager participation is limited to direct reports that are in this calibration cohort.
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
