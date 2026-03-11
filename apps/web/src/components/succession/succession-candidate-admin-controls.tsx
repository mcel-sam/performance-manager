"use client";

import {
  SuccessionAssessmentLevel,
  SuccessionReadiness,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface SuccessionCandidateAdminControlsProps {
  auth: {
    userId: string;
    orgId: string;
  };
  candidate: {
    id: string;
    readiness: SuccessionReadiness;
    riskOfLoss: SuccessionAssessmentLevel | null;
    confidence: SuccessionAssessmentLevel | null;
    sortOrder: number;
  };
}

export default function SuccessionCandidateAdminControls({
  auth,
  candidate,
}: SuccessionCandidateAdminControlsProps) {
  const router = useRouter();
  const [readiness, setReadiness] = useState(candidate.readiness);
  const [riskOfLoss, setRiskOfLoss] = useState(candidate.riskOfLoss ?? "");
  const [confidence, setConfidence] = useState(candidate.confidence ?? "");
  const [sortOrder, setSortOrder] = useState(String(candidate.sortOrder));
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function updateCandidate() {
    setMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/talent/succession/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          readiness,
          riskOfLoss: riskOfLoss === "" ? null : riskOfLoss,
          confidence: confidence === "" ? null : confidence,
          sortOrder: Number(sortOrder),
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to update candidate");
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update candidate");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCandidate() {
    setMessage(null);
    setIsRemoving(true);

    try {
      const response = await fetch(`/api/admin/talent/succession/candidates/${candidate.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to remove candidate");
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove candidate");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/80 p-3">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Readiness
          </span>
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
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Risk
          </span>
          <Select value={riskOfLoss} onChange={(event) => setRiskOfLoss(event.target.value)}>
            <option value="">Not set</option>
            <option value={SuccessionAssessmentLevel.LOW}>Low</option>
            <option value={SuccessionAssessmentLevel.MEDIUM}>Medium</option>
            <option value={SuccessionAssessmentLevel.HIGH}>High</option>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Confidence
          </span>
          <Select value={confidence} onChange={(event) => setConfidence(event.target.value)}>
            <option value="">Not set</option>
            <option value={SuccessionAssessmentLevel.LOW}>Low</option>
            <option value={SuccessionAssessmentLevel.MEDIUM}>Medium</option>
            <option value={SuccessionAssessmentLevel.HIGH}>High</option>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Rank
          </span>
          <Input
            type="number"
            min={0}
            max={999}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={updateCandidate} disabled={isSaving || isRemoving}>
          {isSaving ? "Saving..." : "Save candidate"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={removeCandidate}
          disabled={isSaving || isRemoving}
        >
          {isRemoving ? "Removing..." : "Remove"}
        </Button>
        {message ? <p className="text-sm text-rose-700">{message}</p> : null}
      </div>
    </div>
  );
}
