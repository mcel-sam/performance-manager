"use client";

import { CycleVisibilityPolicy, PeerAssignmentMode } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";

interface ReviewCycleCreateFormProps {
  auth: {
    userId: string;
    orgId: string;
  };
}

const steps = [
  "Basics",
  "Review Types",
  "Reviewer Rules",
  "Visibility & Schedule",
  "Verify",
] as const;

export default function ReviewCycleCreateForm({ auth }: ReviewCycleCreateFormProps) {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("Annual Review 2026");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-12-15");
  const [selfReviewRequired, setSelfReviewRequired] = useState(true);
  const [managerReviewRequired, setManagerReviewRequired] = useState(true);
  const [peerReviewCount, setPeerReviewCount] = useState("1");
  const [upwardReviewCount, setUpwardReviewCount] = useState("1");
  const [peerAssignmentMode, setPeerAssignmentMode] = useState<PeerAssignmentMode>(
    PeerAssignmentMode.HR_ASSIGNED,
  );
  const [upwardReviewsForManagersOnly, setUpwardReviewsForManagersOnly] = useState(true);
  const [visibilityPolicy, setVisibilityPolicy] = useState<CycleVisibilityPolicy>(
    CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
  );
  const [selfReviewDueDate, setSelfReviewDueDate] = useState("2026-11-15");
  const [managerReviewDueDate, setManagerReviewDueDate] = useState("2026-11-25");
  const [peerReviewDueDate, setPeerReviewDueDate] = useState("2026-11-20");
  const [upwardReviewDueDate, setUpwardReviewDueDate] = useState("2026-11-20");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const peerEnabled = Number(peerReviewCount) > 0;
  const upwardEnabled = Number(upwardReviewCount) > 0;

  const reviewTypeSummary = useMemo(() => {
    const items = [
      selfReviewRequired ? "Self" : null,
      managerReviewRequired ? "Manager" : null,
      peerEnabled ? `Peer (${peerReviewCount})` : null,
      upwardEnabled ? `Upward (${upwardReviewCount})` : null,
    ].filter((item): item is string => Boolean(item));

    return items.length === 0 ? "None selected" : items.join(", ");
  }, [
    managerReviewRequired,
    peerEnabled,
    peerReviewCount,
    selfReviewRequired,
    upwardEnabled,
    upwardReviewCount,
  ]);

  function nextStep() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLastStep) {
      nextStep();
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/performance/review-cycles", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          name,
          startDate: toStartOfDayIso(startDate),
          endDate: toEndOfDayIso(endDate),
          visibilityPolicy,
          selfReviewRequired,
          managerReviewRequired,
          peerReviewCount: Number(peerReviewCount),
          peerAssignmentMode,
          upwardReviewCount: Number(upwardReviewCount),
          upwardReviewsForManagersOnly,
          selfReviewDueAt: selfReviewRequired ? toEndOfDayIso(selfReviewDueDate) : undefined,
          managerReviewDueAt: managerReviewRequired
            ? toEndOfDayIso(managerReviewDueDate)
            : undefined,
          peerReviewDueAt: peerEnabled ? toEndOfDayIso(peerReviewDueDate) : undefined,
          upwardReviewDueAt: upwardEnabled ? toEndOfDayIso(upwardReviewDueDate) : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to create review cycle");
      }

      setMessage("Cycle created. Redirecting to cycle list...");
      router.push("/admin/performance/review-cycles");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create review cycle");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Review Cycle</CardTitle>
        <CardDescription>
          Follow this step-by-step wizard to define assignment rules and due dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2"
            >
              <p className="text-xs text-slate-500">Step {index + 1}</p>
              <p className="text-sm font-medium text-slate-900">{step}</p>
              {index < stepIndex ? <StatusChip tone="success">Complete</StatusChip> : null}
              {index === stepIndex ? <StatusChip tone="info">Current</StatusChip> : null}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {stepIndex === 0 ? (
            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Cycle Name</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Start Date</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">End Date</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </label>
            </section>
          ) : null}

          {stepIndex === 1 ? (
            <section className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selfReviewRequired}
                  onChange={(event) => setSelfReviewRequired(event.target.checked)}
                />
                <span className="text-sm text-slate-800">Self review required</span>
              </label>

              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={managerReviewRequired}
                  onChange={(event) => setManagerReviewRequired(event.target.checked)}
                />
                <span className="text-sm text-slate-800">Manager review required</span>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Peer reviews per employee</span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={peerReviewCount}
                  onChange={(event) => setPeerReviewCount(event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Upward reviews per manager</span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={upwardReviewCount}
                  onChange={(event) => setUpwardReviewCount(event.target.value)}
                />
              </label>
            </section>
          ) : null}

          {stepIndex === 2 ? (
            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Peer assignment mode</span>
                <Select
                  value={peerAssignmentMode}
                  onChange={(event) =>
                    setPeerAssignmentMode(event.target.value as PeerAssignmentMode)
                  }
                  disabled={!peerEnabled}
                >
                  <option value={PeerAssignmentMode.HR_ASSIGNED}>HR assigned</option>
                  <option value={PeerAssignmentMode.NOMINATION}>Nomination</option>
                </Select>
              </label>

              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={upwardReviewsForManagersOnly}
                  onChange={(event) => setUpwardReviewsForManagersOnly(event.target.checked)}
                  disabled={!upwardEnabled}
                />
                <span className="text-sm text-slate-800">Upward reviews for managers only</span>
              </label>
            </section>
          ) : null}

          {stepIndex === 3 ? (
            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Visibility policy</span>
                <Select
                  value={visibilityPolicy}
                  onChange={(event) =>
                    setVisibilityPolicy(event.target.value as CycleVisibilityPolicy)
                  }
                >
                  <option value={CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE}>
                    Employee after release
                  </option>
                  <option value={CycleVisibilityPolicy.MANAGER_ONLY}>Manager only</option>
                </Select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Self due date</span>
                <Input
                  type="date"
                  value={selfReviewDueDate}
                  onChange={(event) => setSelfReviewDueDate(event.target.value)}
                  disabled={!selfReviewRequired}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Manager due date</span>
                <Input
                  type="date"
                  value={managerReviewDueDate}
                  onChange={(event) => setManagerReviewDueDate(event.target.value)}
                  disabled={!managerReviewRequired}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Peer due date</span>
                <Input
                  type="date"
                  value={peerReviewDueDate}
                  onChange={(event) => setPeerReviewDueDate(event.target.value)}
                  disabled={!peerEnabled}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Upward due date</span>
                <Input
                  type="date"
                  value={upwardReviewDueDate}
                  onChange={(event) => setUpwardReviewDueDate(event.target.value)}
                  disabled={!upwardEnabled}
                />
              </label>
            </section>
          ) : null}

          {stepIndex === 4 ? (
            <section className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                Verify what will be generated before creating the cycle.
              </p>
              <p className="text-sm text-slate-800">
                <strong>Name:</strong> {name}
              </p>
              <p className="text-sm text-slate-800">
                <strong>Window:</strong> {startDate} to {endDate}
              </p>
              <p className="text-sm text-slate-800">
                <strong>Review types:</strong> {reviewTypeSummary}
              </p>
              <p className="text-sm text-slate-800">
                <strong>Peer mode:</strong> {peerAssignmentMode}
              </p>
              <p className="text-sm text-slate-800">
                <strong>Visibility:</strong> {visibilityPolicy}
              </p>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={previousStep} disabled={isFirstStep}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Creating..."
                : isLastStep
                  ? "Create cycle"
                  : `Next: ${steps[stepIndex + 1]}`}
            </Button>
            <span className="text-xs text-slate-600">
              Step {stepIndex + 1} of {steps.length}
            </span>
          </div>
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function toStartOfDayIso(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toEndOfDayIso(value: string): string {
  return new Date(`${value}T23:59:59.999Z`).toISOString();
}
