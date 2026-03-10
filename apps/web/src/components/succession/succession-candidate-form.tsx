"use client";

import {
  SuccessionAssessmentLevel,
  SuccessionReadiness,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SuccessionEmployeeOption } from "@/server/succession/succession-service";

interface SuccessionCandidateFormProps {
  auth: {
    userId: string;
    orgId: string;
  };
  positionId: string;
  employeeOptions: SuccessionEmployeeOption[];
  viewerMode: "HR_ADMIN" | "MANAGER";
}

export default function SuccessionCandidateForm({
  auth,
  positionId,
  employeeOptions,
  viewerMode,
}: SuccessionCandidateFormProps) {
  const router = useRouter();
  const [candidateEmployeeId, setCandidateEmployeeId] = useState("");
  const [readiness, setReadiness] = useState<SuccessionReadiness>(
    SuccessionReadiness.ONE_TO_TWO_YEARS,
  );
  const [riskOfLoss, setRiskOfLoss] = useState("");
  const [confidence, setConfidence] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const basePath =
        viewerMode === "HR_ADMIN"
          ? `/api/admin/talent/succession/positions/${positionId}/candidates`
          : `/api/talent/succession/positions/${positionId}/candidates`;
      const response = await fetch(basePath, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          candidateEmployeeId,
          readiness,
          riskOfLoss:
            viewerMode === "HR_ADMIN" && riskOfLoss !== ""
              ? (riskOfLoss as SuccessionAssessmentLevel)
              : null,
          confidence:
            viewerMode === "HR_ADMIN" && confidence !== ""
              ? (confidence as SuccessionAssessmentLevel)
              : null,
          sortOrder: sortOrder.trim() === "" ? undefined : Number(sortOrder),
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to add candidate");
      }

      setCandidateEmployeeId("");
      setRiskOfLoss("");
      setConfidence("");
      setSortOrder("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add candidate");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{viewerMode === "HR_ADMIN" ? "Add Candidate" : "Propose Candidate"}</CardTitle>
        <CardDescription>
          {viewerMode === "HR_ADMIN"
            ? "Maintain the ranked slate for this position."
            : "Managers can propose direct reports for visible succession plans."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2"
          data-testid="succession-candidate-form"
        >
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Candidate</span>
            <Select
              value={candidateEmployeeId}
              onChange={(event) => setCandidateEmployeeId(event.target.value)}
              required
            >
              <option value="">Select employee</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} {employee.title ? `(${employee.title})` : ""}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Readiness</span>
            <Select
              value={readiness}
              onChange={(event) => setReadiness(event.target.value as SuccessionReadiness)}
            >
              <option value={SuccessionReadiness.READY_NOW}>Ready now</option>
              <option value={SuccessionReadiness.ONE_TO_TWO_YEARS}>1-2 years</option>
              <option value={SuccessionReadiness.THREE_TO_FIVE_YEARS}>3-5 years</option>
              <option value={SuccessionReadiness.FUTURE}>Future</option>
            </Select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Priority rank</span>
            <Input
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              placeholder="Optional"
            />
          </label>

          {viewerMode === "HR_ADMIN" ? (
            <>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Risk of loss</span>
                <Select value={riskOfLoss} onChange={(event) => setRiskOfLoss(event.target.value)}>
                  <option value="">Not set</option>
                  <option value={SuccessionAssessmentLevel.LOW}>Low</option>
                  <option value={SuccessionAssessmentLevel.MEDIUM}>Medium</option>
                  <option value={SuccessionAssessmentLevel.HIGH}>High</option>
                </Select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Confidence</span>
                <Select value={confidence} onChange={(event) => setConfidence(event.target.value)}>
                  <option value="">Not set</option>
                  <option value={SuccessionAssessmentLevel.LOW}>Low</option>
                  <option value={SuccessionAssessmentLevel.MEDIUM}>Medium</option>
                  <option value={SuccessionAssessmentLevel.HIGH}>High</option>
                </Select>
              </label>
            </>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} data-testid="succession-candidate-submit">
              {isSubmitting
                ? viewerMode === "HR_ADMIN"
                  ? "Adding..."
                  : "Proposing..."
                : viewerMode === "HR_ADMIN"
                  ? "Add candidate"
                  : "Propose candidate"}
            </Button>
            {message ? <p className="text-sm text-rose-700">{message}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
