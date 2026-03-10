"use client";

import { SuccessionNoteVisibility } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SuccessionNoteFormProps {
  auth: {
    userId: string;
    orgId: string;
  };
  candidateId: string;
  viewerMode: "HR_ADMIN" | "MANAGER";
}

export default function SuccessionNoteForm({
  auth,
  candidateId,
  viewerMode,
}: SuccessionNoteFormProps) {
  const router = useRouter();
  const [visibility, setVisibility] = useState<SuccessionNoteVisibility>(
    SuccessionNoteVisibility.PLAN_VIEWERS,
  );
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint =
        viewerMode === "HR_ADMIN"
          ? `/api/admin/talent/succession/candidates/${candidateId}/notes`
          : `/api/talent/succession/candidates/${candidateId}/notes`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          visibility,
          body,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to add note");
      }

      setBody("");
      setVisibility(SuccessionNoteVisibility.PLAN_VIEWERS);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add note");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="succession-note-form">
      {viewerMode === "HR_ADMIN" ? (
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Visibility
          </span>
          <Select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as SuccessionNoteVisibility)
            }
          >
            <option value={SuccessionNoteVisibility.PLAN_VIEWERS}>Plan viewers</option>
            <option value={SuccessionNoteVisibility.HR_ONLY}>HR only</option>
          </Select>
        </label>
      ) : null}

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Note
        </span>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder="Capture context, concerns, or succession timing notes."
          required
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isSubmitting} data-testid="succession-note-submit">
          {isSubmitting ? "Adding..." : "Add note"}
        </Button>
        {message ? <p className="text-sm text-rose-700">{message}</p> : null}
      </div>
    </form>
  );
}
