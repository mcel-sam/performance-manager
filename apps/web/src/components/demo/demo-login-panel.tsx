"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";

interface DemoRoleTile {
  role: "HR_ADMIN" | "SUPER_ADMIN" | "MANAGER" | "EMPLOYEE";
  label: string;
  subtitle: string;
  testId: string;
}

interface DemoLoginPanelProps {
  demoEnabled: boolean;
  roleTiles: DemoRoleTile[];
}

interface DemoResetSuccessPayload {
  seededAt: string;
  summary: {
    users: number;
    employees: number;
    packets: number;
    submissions: number;
    answers: number;
    evidenceItems: number;
    evidenceLinks: number;
  };
}

type FeedbackState = {
  variant: "info" | "success" | "warning" | "error";
  message: string;
} | null;

export default function DemoLoginPanel({ demoEnabled, roleTiles }: DemoLoginPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [signingInRole, setSigningInRole] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [lastSeededAt, setLastSeededAt] = useState<string | null>(null);
  const [lastSeedSummary, setLastSeedSummary] = useState<DemoResetSuccessPayload["summary"] | null>(
    null,
  );

  const resetDisabled = !demoEnabled || isResetting || resetConfirmation !== "RESET";
  const formattedLastSeededAt = useMemo(() => {
    if (!lastSeededAt) {
      return null;
    }

    const parsed = new Date(lastSeededAt);
    if (Number.isNaN(parsed.getTime())) {
      return lastSeededAt;
    }

    return parsed.toLocaleString();
  }, [lastSeededAt]);

  async function handleRoleSignIn(role: DemoRoleTile["role"]) {
    setFeedback(null);
    setSigningInRole(role);

    try {
      const response = await fetch("/api/demo/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to sign in with demo role.");
      }

      setFeedback({
        variant: "success",
        message: "Signed in. Redirecting to home...",
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      setFeedback({
        variant: "error",
        message: error instanceof Error ? error.message : "Unable to sign in with demo role.",
      });
    } finally {
      setSigningInRole(null);
    }
  }

  async function handleResetDemoData() {
    setIsResetting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/demo/reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          confirmation: "RESET",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to reset demo data.");
      }

      const successPayload = payload as DemoResetSuccessPayload;
      setLastSeededAt(successPayload.seededAt);
      setLastSeedSummary(successPayload.summary);
      setFeedback({
        variant: "success",
        message: "Demo data reset complete. Role login is ready.",
      });
      setResetModalOpen(false);
      setResetConfirmation("");
      router.refresh();
    } catch (error) {
      setFeedback({
        variant: "error",
        message: error instanceof Error ? error.message : "Unable to reset demo data.",
      });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Choose a demo role</CardTitle>
          <CardDescription>
            Select a role to sign in immediately. No manual credential entry is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {demoEnabled ? (
            <div className="grid gap-3 md:grid-cols-2">
              {roleTiles.map((tile) => (
                <button
                  key={tile.role}
                  type="button"
                  data-testid={tile.testId}
                  onClick={() => void handleRoleSignIn(tile.role)}
                  disabled={signingInRole !== null}
                  className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {signingInRole === tile.role ? "Signing in..." : tile.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{tile.subtitle}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-700">
              Demo login is unavailable because <code>DEMO_MODE=true</code> and development mode are
              required.
            </p>
          )}

          <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Reset demo database &amp; load sample data
            </p>
            <p className="mt-1 text-xs text-slate-600">
              This wipes local database data and seeds a realistic construction-company walkthrough
              dataset.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="danger"
                onClick={() => setResetModalOpen(true)}
                disabled={!demoEnabled || isResetting}
                data-testid="login-reset-demo-button"
              >
                {isResetting ? "Resetting..." : "Reset demo database & load sample data"}
              </Button>
              {formattedLastSeededAt ? (
                <p className="text-xs text-slate-600" data-testid="login-last-seeded-at">
                  Last seeded at {formattedLastSeededAt}
                </p>
              ) : null}
            </div>
            {lastSeedSummary ? (
              <p className="mt-2 text-xs text-slate-500">
                Seeded {lastSeedSummary.employees} employees, {lastSeedSummary.submissions} submissions,
                and {lastSeedSummary.evidenceItems} evidence items.
              </p>
            ) : null}
          </div>

          {feedback ? <Toast variant={feedback.variant}>{feedback.message}</Toast> : null}
        </CardContent>
      </Card>

      <Modal
        open={resetModalOpen}
        onClose={() => {
          if (isResetting) {
            return;
          }
          setResetModalOpen(false);
          setResetConfirmation("");
        }}
        title="Reset demo data"
        description="This action permanently clears local demo data and recreates it. Type RESET to continue."
      >
        <div className="space-y-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-800">Type RESET to confirm</span>
            <Input
              value={resetConfirmation}
              onChange={(event) => setResetConfirmation(event.target.value)}
              placeholder="RESET"
              aria-label="Type RESET to confirm demo reset"
              data-testid="login-reset-demo-input"
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!isResetting) {
                  setResetModalOpen(false);
                  setResetConfirmation("");
                }
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={resetDisabled}
              onClick={() => void handleResetDemoData()}
              data-testid="login-reset-demo-confirm"
            >
              {isResetting ? "Resetting..." : "Confirm reset"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
