"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";

type DemoSetupStep = "org" | "cycle" | "calibration" | "improvement-plan" | "all";

const steps: Array<{ step: DemoSetupStep; title: string; description: string }> = [
  {
    step: "org",
    title: "Create demo org and users",
    description: "Creates HR, calibrator, manager, employee, and peer accounts with hierarchy.",
  },
  {
    step: "cycle",
    title: "Create review cycle and submissions",
    description: "Creates template questions, cycle config, packets, and seeded review assignments.",
  },
  {
    step: "calibration",
    title: "Create calibration session",
    description: "Creates one calibration session with participants and initial placements.",
  },
  {
    step: "improvement-plan",
    title: "Create improvement plan",
    description: "Creates one improvement plan with goals and an initial timeline check-in.",
  },
  {
    step: "all",
    title: "Run full demo setup",
    description: "Runs all setup steps in order.",
  },
];

export default function DemoSetupPanel() {
  const [runningStep, setRunningStep] = useState<DemoSetupStep | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runStep(step: DemoSetupStep) {
    setRunningStep(step);
    setMessage(null);

    try {
      const response = await fetch("/api/demo/setup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ step }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Demo setup failed");
      }

      setMessage(`Setup step "${step}" completed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Demo setup failed");
    } finally {
      setRunningStep(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Setup</CardTitle>
        <CardDescription>
          Provision demo data directly from the UI. This endpoint is enabled only in development demo mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((entry) => (
          <div
            key={entry.step}
            className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3"
          >
            <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
            <p className="mt-1 text-xs text-slate-600">{entry.description}</p>
            <Button
              type="button"
              size="sm"
              variant={entry.step === "all" ? "primary" : "outline"}
              className="mt-3"
              onClick={() => void runStep(entry.step)}
              disabled={runningStep !== null}
              data-testid={`demo-setup-${entry.step}`}
            >
              {runningStep === entry.step ? "Running..." : "Run"}
            </Button>
          </div>
        ))}

        {message ? <Toast variant={message.includes("failed") ? "error" : "success"}>{message}</Toast> : null}
      </CardContent>
    </Card>
  );
}
