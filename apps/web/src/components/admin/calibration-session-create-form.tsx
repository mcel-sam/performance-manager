"use client";

import { CalibrationBucket, CycleStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CalibrationSessionCreateOptionData } from "@/server/calibration/calibration-admin-options-service";

interface CalibrationSessionCreateFormProps {
  options: CalibrationSessionCreateOptionData;
  auth: {
    userId: string;
    orgId: string;
  };
}

interface AxisDraftEntry {
  bucket: CalibrationBucket;
  label: string;
  description: string;
}

const axisOrder: CalibrationBucket[] = [
  CalibrationBucket.LOW,
  CalibrationBucket.MEDIUM,
  CalibrationBucket.HIGH,
];

const cycleStatusLabel: Record<CycleStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  LOCKED: "Locked",
  RELEASED: "Released",
};

const initialPerformanceAxis: AxisDraftEntry[] = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Needs support",
    description: "Consistently below this cycle's expectations.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Meets expectations",
    description: "Delivers solid results at the expected level.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Exceeds expectations",
    description: "Delivers standout results beyond expected scope.",
  },
];

const initialPotentialAxis: AxisDraftEntry[] = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Current scope",
    description: "Effective in the current scope with limited near-term expansion.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Growth ready",
    description: "Can take broader scope with coaching and support.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Accelerated growth",
    description: "Shows strong readiness for larger and more complex scope.",
  },
];

export default function CalibrationSessionCreateForm({
  options,
  auth,
}: CalibrationSessionCreateFormProps) {
  const router = useRouter();

  const [name, setName] = useState("Q2 2026 Calibration Session");
  const [roleGroup, setRoleGroup] = useState("Core Engineering");
  const [description, setDescription] = useState("");
  const [cycleId, setCycleId] = useState(options.cycles[0]?.id ?? "");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedParticipantUserIds, setSelectedParticipantUserIds] = useState<string[]>([
    auth.userId,
  ]);
  const [performanceAxis, setPerformanceAxis] = useState<AxisDraftEntry[]>(initialPerformanceAxis);
  const [potentialAxis, setPotentialAxis] = useState<AxisDraftEntry[]>(initialPotentialAxis);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedCycle = useMemo(
    () => options.cycles.find((cycle) => cycle.id === cycleId) ?? null,
    [cycleId, options.cycles],
  );

  function toggleEmployeeSelection(employeeId: string) {
    setSelectedEmployeeIds((previous) =>
      previous.includes(employeeId)
        ? previous.filter((id) => id !== employeeId)
        : [...previous, employeeId],
    );
  }

  function toggleParticipantSelection(userId: string) {
    setSelectedParticipantUserIds((previous) =>
      previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId],
    );
  }

  function updateAxisEntry(
    axis: "performance" | "potential",
    bucket: CalibrationBucket,
    field: "label" | "description",
    value: string,
  ) {
    const setter = axis === "performance" ? setPerformanceAxis : setPotentialAxis;
    setter((previous) =>
      previous.map((entry) => (entry.bucket === bucket ? { ...entry, [field]: value } : entry)),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!cycleId) {
      setMessage("Select a review cycle.");
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      setMessage("Select at least one cohort member.");
      return;
    }

    if (selectedParticipantUserIds.length === 0) {
      setMessage("Select at least one participant.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/performance/calibration", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          cycleId,
          name,
          roleGroup,
          description: description.trim() || null,
          cohortEmployeeIds: selectedEmployeeIds,
          participantUserIds: selectedParticipantUserIds,
          performanceAxis: performanceAxis.map((entry) => ({
            bucket: entry.bucket,
            label: entry.label,
            description: entry.description,
          })),
          potentialAxis: potentialAxis.map((entry) => ({
            bucket: entry.bucket,
            label: entry.label,
            description: entry.description,
          })),
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        session?: {
          id: string;
        };
      };

      if (!response.ok || !payload.session) {
        throw new Error(payload.message ?? "Unable to create calibration session");
      }

      setMessage("Calibration session created.");
      router.push("/admin/performance/calibration");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create calibration session");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Calibration Session</CardTitle>
        <CardDescription>
          Choose a cycle, define the cohort, configure axis labels, and assign participants.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Session Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Role Group</span>
              <Input
                value={roleGroup}
                onChange={(event) => setRoleGroup(event.target.value)}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Cycle</span>
              <Select value={cycleId} onChange={(event) => setCycleId(event.target.value)} required>
                <option value="">Select cycle</option>
                {options.cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} ({cycleStatusLabel[cycle.status]})
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description (optional)</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Context for this calibration session"
              />
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Cohort Members</h3>
            <p className="mt-1 text-xs text-slate-600">
              Select employees to include in this calibration 9-box.
            </p>
            <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-2 md:grid-cols-2">
              {options.employees.length === 0 ? (
                <p className="text-sm text-slate-600">No employees available.</p>
              ) : (
                options.employees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span>{employee.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Participants</h3>
            <p className="mt-1 text-xs text-slate-600">
              Select HR, managers, and calibrators who can participate.
            </p>
            <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-2 md:grid-cols-2">
              {options.participants.length === 0 ? (
                <p className="text-sm text-slate-600">No eligible participants available.</p>
              ) : (
                options.participants.map((participant) => (
                  <label
                    key={participant.id}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipantUserIds.includes(participant.id)}
                      onChange={() => toggleParticipantSelection(participant.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span>
                      {participant.name} ({participant.role})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <AxisConfigEditor
            title="Performance Axis"
            entries={performanceAxis}
            onChange={(bucket, field, value) =>
              updateAxisEntry("performance", bucket, field, value)
            }
          />

          <AxisConfigEditor
            title="Potential Axis"
            entries={potentialAxis}
            onChange={(bucket, field, value) =>
              updateAxisEntry("potential", bucket, field, value)
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting || !selectedCycle}>
              {isSubmitting ? "Creating..." : "Create Session"}
            </Button>
            {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface AxisConfigEditorProps {
  title: string;
  entries: AxisDraftEntry[];
  onChange: (
    bucket: CalibrationBucket,
    field: "label" | "description",
    value: string,
  ) => void;
}

function AxisConfigEditor({ title, entries, onChange }: AxisConfigEditorProps) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">
        {axisOrder.map((bucket) => {
          const entry = entries.find((item) => item.bucket === bucket);
          if (!entry) {
            return null;
          }

          return (
            <div key={bucket} className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {bucket}
              </p>
              <div className="mt-2 grid gap-2">
                <Input
                  value={entry.label}
                  onChange={(event) => onChange(bucket, "label", event.target.value)}
                  required
                  aria-label={`${title} ${bucket} label`}
                />
                <Input
                  value={entry.description}
                  onChange={(event) => onChange(bucket, "description", event.target.value)}
                  required
                  aria-label={`${title} ${bucket} description`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
