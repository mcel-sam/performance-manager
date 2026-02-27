"use client";

import { CycleVisibilityPolicy } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface ReviewCycleCreateFormProps {
  auth: {
    userId: string;
    orgId: string;
  };
}

export default function ReviewCycleCreateForm({ auth }: ReviewCycleCreateFormProps) {
  const router = useRouter();

  const [name, setName] = useState("Q2 2026 Performance Cycle");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-04-30");
  const [peerReviewCount, setPeerReviewCount] = useState("1");
  const [upwardReviewCount, setUpwardReviewCount] = useState("0");
  const [visibilityPolicy, setVisibilityPolicy] = useState<CycleVisibilityPolicy>(
    CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
          startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${endDate}T00:00:00.000Z`).toISOString(),
          visibilityPolicy,
          selfReviewRequired: true,
          managerReviewRequired: true,
          peerReviewCount: Number(peerReviewCount),
          upwardReviewCount: Number(upwardReviewCount),
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
          Configure the cycle window and participant review mix for this run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Peer Reviews per Subject</span>
            <Input
              type="number"
              min={0}
              max={20}
              value={peerReviewCount}
              onChange={(event) => setPeerReviewCount(event.target.value)}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Upward Reviews per Subject</span>
            <Input
              type="number"
              min={0}
              max={20}
              value={upwardReviewCount}
              onChange={(event) => setUpwardReviewCount(event.target.value)}
              required
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Visibility Policy</span>
            <Select
              value={visibilityPolicy}
              onChange={(event) => setVisibilityPolicy(event.target.value as CycleVisibilityPolicy)}
            >
              <option value={CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE}>
                Employee after release
              </option>
              <option value={CycleVisibilityPolicy.MANAGER_ONLY}>Manager only</option>
            </Select>
          </label>

          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Cycle"}
            </Button>
            {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
