"use client";

import { GoalCycleCadence, GoalCycleStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { Toast } from "@/components/ui/toast";

interface GoalCycleRow {
  id: string;
  name: string;
  cadence: GoalCycleCadence;
  status: GoalCycleStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  goalCount: number;
}

interface GoalCycleRowDraft extends GoalCycleRow {
  startDateInput: string;
  endDateInput: string;
}

interface GoalCyclesManagerProps {
  auth: {
    userId: string;
    orgId: string;
  };
  cycles: GoalCycleRow[];
}

export default function GoalCyclesManager({ auth, cycles }: GoalCyclesManagerProps) {
  const router = useRouter();
  const [rows, setRows] = useState<GoalCycleRowDraft[]>(
    cycles.map((cycle) => toGoalCycleRowDraft(cycle)),
  );
  const [name, setName] = useState("FY26 Annual Goals");
  const [cadence, setCadence] = useState<GoalCycleCadence>(GoalCycleCadence.ANNUAL);
  const [status, setStatus] = useState<GoalCycleStatus>(GoalCycleStatus.DRAFT);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("create");
    setMessage(null);

    try {
      const response = await fetch("/api/goals/cycles", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          name,
          cadence,
          status,
          startDate: toStartOfDayIso(startDate),
          endDate: toEndOfDayIso(endDate),
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        cycle?: GoalCycleRow;
      };

      if (!response.ok || !payload.cycle) {
        throw new Error(payload.message ?? "Unable to create goal cycle");
      }

      const createdCycle = toGoalCycleRowDraft(payload.cycle);
      setRows((current) => [
        createdCycle,
        ...current,
      ]);
      setMessage("Goal cycle created.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create goal cycle");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleSave(cycleId: string) {
    const row = rows.find((item) => item.id === cycleId);
    if (!row) {
      return;
    }

    setBusyKey(cycleId);
    setMessage(null);

    try {
      const response = await fetch(`/api/goals/cycles/${cycleId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          name: row.name,
          cadence: row.cadence,
          status: row.status,
          startDate: toStartOfDayIso(row.startDateInput),
          endDate: toEndOfDayIso(row.endDateInput),
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        cycle?: GoalCycleRow;
      };

      if (!response.ok || !payload.cycle) {
        throw new Error(payload.message ?? "Unable to update goal cycle");
      }

      const updatedCycle = toGoalCycleRowDraft(payload.cycle);
      setRows((current) =>
        current.map((item) =>
          item.id === cycleId
            ? {
                ...item,
                ...updatedCycle,
              }
            : item,
        ),
      );
      setMessage(`Saved ${updatedCycle.name}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update goal cycle");
    } finally {
      setBusyKey(null);
    }
  }

  function updateRow(
    cycleId: string,
    field:
      | "name"
      | "cadence"
      | "status"
      | "startDateInput"
      | "endDateInput",
    value: string,
  ) {
    setRows((current) =>
      current.map((item) =>
        item.id === cycleId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create goal cycle</CardTitle>
          <CardDescription>Set the cadence, dates, and starting status for the next planning window.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
            data-testid="goal-cycle-create-form"
          >
            <label className="space-y-1 xl:col-span-2">
              <span className="text-sm font-medium text-slate-700">Cycle name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Cadence</span>
              <Select
                value={cadence}
                onChange={(event) => setCadence(event.target.value as GoalCycleCadence)}
              >
                <option value={GoalCycleCadence.ANNUAL}>Annual</option>
                <option value={GoalCycleCadence.QUARTERLY}>Quarterly</option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as GoalCycleStatus)}
              >
                <option value={GoalCycleStatus.DRAFT}>Draft</option>
                <option value={GoalCycleStatus.ACTIVE}>Active</option>
                <option value={GoalCycleStatus.CLOSED}>Closed</option>
                <option value={GoalCycleStatus.ARCHIVED}>Archived</option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Start date</span>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">End date</span>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
            </label>

            <div className="flex items-end xl:col-span-5">
              <Button
                type="submit"
                disabled={busyKey === "create"}
                data-testid="goal-cycle-create-submit"
              >
                {busyKey === "create" ? "Creating..." : "Create goal cycle"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage goal cycles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">No goal cycles yet.</div>
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Cadence</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Goals</TableHead>
                    <TableHead>Save</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="min-w-[260px]">
                        <Input
                          value={cycle.name}
                          onChange={(event) => updateRow(cycle.id, "name", event.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={cycle.cadence}
                          onChange={(event) =>
                            updateRow(cycle.id, "cadence", event.target.value)
                          }
                        >
                          <option value={GoalCycleCadence.ANNUAL}>Annual</option>
                          <option value={GoalCycleCadence.QUARTERLY}>Quarterly</option>
                        </Select>
                      </TableCell>
                      <TableCell className="space-y-2">
                        <Input
                          type="date"
                          value={cycle.startDateInput}
                          onChange={(event) =>
                            updateRow(cycle.id, "startDateInput", event.target.value)
                          }
                        />
                        <Input
                          type="date"
                          value={cycle.endDateInput}
                          onChange={(event) =>
                            updateRow(cycle.id, "endDateInput", event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={cycle.status}
                          onChange={(event) =>
                            updateRow(cycle.id, "status", event.target.value)
                          }
                        >
                          <option value={GoalCycleStatus.DRAFT}>Draft</option>
                          <option value={GoalCycleStatus.ACTIVE}>Active</option>
                          <option value={GoalCycleStatus.CLOSED}>Closed</option>
                          <option value={GoalCycleStatus.ARCHIVED}>Archived</option>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <p className="text-lg font-semibold text-slate-900">{cycle.goalCount}</p>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyKey === cycle.id}
                          onClick={() => void handleSave(cycle.id)}
                          data-testid={`goal-cycle-save-${cycle.id}`}
                        >
                          {busyKey === cycle.id ? "Saving..." : "Save"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}

          {message ? (
            <Toast
              variant={message.toLowerCase().includes("unable") ? "error" : "success"}
              className="mx-4 mb-4"
            >
              {message}
            </Toast>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function toStartOfDayIso(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toEndOfDayIso(value: string) {
  return new Date(`${value}T23:59:59.999Z`).toISOString();
}

function toGoalCycleRowDraft(cycle: GoalCycleRow): GoalCycleRowDraft {
  return {
    ...cycle,
    startDateInput: cycle.startDate.slice(0, 10),
    endDateInput: cycle.endDate.slice(0, 10),
  };
}
