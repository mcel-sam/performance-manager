"use client";

import { PositionStatus, SuccessionVisibilityScope } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SuccessionEmployeeOption } from "@/server/succession/succession-service";

interface SuccessionPositionFormProps {
  auth: {
    userId: string;
    orgId: string;
  };
  mode: "create" | "edit";
  employees: SuccessionEmployeeOption[];
  managers: SuccessionEmployeeOption[];
  positionId?: string;
  initialValues?: {
    title: string;
    department: string;
    location: string | null;
    incumbentEmployeeId: string | null;
    isCritical: boolean;
    status: PositionStatus;
    ownerEmployeeId: string;
    visibilityScope: SuccessionVisibilityScope;
    reviewCadence: string | null;
    notes: string | null;
    collaboratorEmployeeIds: string[];
    allowedManagerEmployeeIds: string[];
  };
}

export default function SuccessionPositionForm({
  auth,
  mode,
  employees,
  managers,
  positionId,
  initialValues,
}: SuccessionPositionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [department, setDepartment] = useState(initialValues?.department ?? "");
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [incumbentEmployeeId, setIncumbentEmployeeId] = useState(
    initialValues?.incumbentEmployeeId ?? "",
  );
  const [isCritical, setIsCritical] = useState(initialValues?.isCritical ?? true);
  const [status, setStatus] = useState<PositionStatus>(
    initialValues?.status ?? PositionStatus.ACTIVE,
  );
  const [ownerEmployeeId, setOwnerEmployeeId] = useState(initialValues?.ownerEmployeeId ?? "");
  const [visibilityScope, setVisibilityScope] = useState<SuccessionVisibilityScope>(
    initialValues?.visibilityScope ?? SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
  );
  const [reviewCadence, setReviewCadence] = useState(initialValues?.reviewCadence ?? "Quarterly");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [collaboratorEmployeeIds, setCollaboratorEmployeeIds] = useState<string[]>(
    initialValues?.collaboratorEmployeeIds ?? [],
  );
  const [allowedManagerEmployeeIds, setAllowedManagerEmployeeIds] = useState<string[]>(
    initialValues?.allowedManagerEmployeeIds ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleSelection(
    currentValues: string[],
    targetValue: string,
    setter: (value: string[]) => void,
  ) {
    setter(
      currentValues.includes(targetValue)
        ? currentValues.filter((value) => value !== targetValue)
        : [...currentValues, targetValue],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/talent/succession/positions"
          : `/api/admin/talent/succession/positions/${positionId ?? ""}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          title,
          department,
          location: location.trim() === "" ? null : location,
          incumbentEmployeeId: incumbentEmployeeId.trim() === "" ? null : incumbentEmployeeId,
          isCritical,
          status,
          ownerEmployeeId,
          visibilityScope,
          reviewCadence: reviewCadence.trim() === "" ? null : reviewCadence,
          notes: notes.trim() === "" ? null : notes,
          collaboratorEmployeeIds,
          allowedManagerEmployeeIds,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        position?: {
          id: string;
        };
      };

      if (!response.ok || !payload.position) {
        throw new Error(payload.message ?? "Unable to save succession position");
      }

      const destination =
        mode === "create"
          ? `/admin/talent/succession/positions/${payload.position.id}`
          : `/admin/talent/succession/positions/${positionId ?? payload.position.id}`;
      router.push(destination);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save succession position",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Position & Plan" : "Update Position & Plan"}</CardTitle>
        <CardDescription>
          Define the role, ownership, scope, and planning notes for this succession position.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="succession-position-form">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Position title</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Department</span>
              <Input
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Location</span>
              <Input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Edmonton"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Incumbent</span>
              <Select
                value={incumbentEmployeeId}
                onChange={(event) => setIncumbentEmployeeId(event.target.value)}
              >
                <option value="">No incumbent</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} {employee.title ? `(${employee.title})` : ""}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Plan owner</span>
              <Select
                value={ownerEmployeeId}
                onChange={(event) => setOwnerEmployeeId(event.target.value)}
                required
              >
                <option value="">Select owner</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} {employee.title ? `(${employee.title})` : ""}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Visibility scope</span>
              <Select
                value={visibilityScope}
                onChange={(event) =>
                  setVisibilityScope(event.target.value as SuccessionVisibilityScope)
                }
              >
                <option value={SuccessionVisibilityScope.MANAGERS_IN_SCOPE}>
                  Managers in scope
                </option>
                <option value={SuccessionVisibilityScope.HR_ONLY}>HR only</option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as PositionStatus)}
              >
                <option value={PositionStatus.ACTIVE}>Active</option>
                <option value={PositionStatus.ARCHIVED}>Archived</option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Review cadence</span>
              <Input
                value={reviewCadence}
                onChange={(event) => setReviewCadence(event.target.value)}
                placeholder="Quarterly"
              />
            </label>

            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(event) => setIsCritical(event.target.checked)}
              />
              <span className="text-sm text-slate-800">Critical role</span>
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Planning notes</span>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Capture role continuity context, bench depth, and next-review expectations."
              />
            </label>
          </div>

          <SelectionPanel
            title="Collaborators"
            description="Optional plan collaborators with read/write access alongside the owner."
            options={employees}
            selectedIds={collaboratorEmployeeIds}
            onToggle={(employeeId) =>
              toggleSelection(
                collaboratorEmployeeIds,
                employeeId,
                setCollaboratorEmployeeIds,
              )
            }
          />

          <SelectionPanel
            title="Allowed managers"
            description="Managers who can view the plan even if they are outside the default area scope."
            options={managers}
            selectedIds={allowedManagerEmployeeIds}
            onToggle={(employeeId) =>
              toggleSelection(
                allowedManagerEmployeeIds,
                employeeId,
                setAllowedManagerEmployeeIds,
              )
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} data-testid="succession-position-submit">
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Position"
                  : "Save Changes"}
            </Button>
            {message ? <p className="text-sm text-rose-700">{message}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectionPanel({
  title,
  description,
  options,
  selectedIds,
  onToggle,
}: {
  title: string;
  description: string;
  options: SuccessionEmployeeOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
      <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
        {options.length === 0 ? (
          <p className="text-sm text-slate-600">No options available.</p>
        ) : (
          options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => onToggle(option.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>
                {option.name}
                {option.title ? ` (${option.title})` : ""}
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  );
}
