"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

interface GrowAssignmentsManagerProps {
  auth: {
    userId: string;
    orgId: string;
  };
  employees: Array<{
    id: string;
    name: string;
    department: string | null;
    title: string | null;
    managerName: string | null;
  }>;
  tracks: Array<{
    id: string;
    name: string;
    isPublished: boolean;
    levels: Array<{
      id: string;
      name: string;
      slug: string;
      levelOrder: number;
    }>;
  }>;
  assignments: Array<{
    id: string;
    assignedAt: string;
    employee: {
      id: string;
      name: string;
      department: string | null;
      title: string | null;
    };
    track: {
      id: string;
      name: string;
    };
    trackLevel: {
      id: string;
      name: string;
      levelOrder: number;
    };
  }>;
}

export default function GrowAssignmentsManager({
  auth,
  employees,
  tracks,
  assignments,
}: GrowAssignmentsManagerProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(assignments[0]?.employee.id ?? "");
  const [trackId, setTrackId] = useState(assignments[0]?.track.id ?? tracks[0]?.id ?? "");
  const [trackLevelId, setTrackLevelId] = useState(assignments[0]?.trackLevel.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const assignmentsByEmployee = useMemo(
    () =>
      new Map(
        assignments.map((assignment) => [assignment.employee.id, assignment] as const),
      ),
    [assignments],
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = employeeSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return employees;
    }

    return employees.filter((employee) =>
      [employee.name, employee.department, employee.title, employee.managerName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [employeeSearch, employees]);

  const selectedTrack = tracks.find((track) => track.id === trackId) ?? null;
  const existingAssignment = employeeId ? assignmentsByEmployee.get(employeeId) ?? null : null;

  useEffect(() => {
    if (!employeeId) {
      return;
    }

    const nextAssignment = assignmentsByEmployee.get(employeeId);
    if (nextAssignment) {
      setTrackId(nextAssignment.track.id);
      setTrackLevelId(nextAssignment.trackLevel.id);
      return;
    }

    if (tracks[0]) {
      setTrackId(tracks[0].id);
      setTrackLevelId(tracks[0].levels[0]?.id ?? "");
    }
  }, [assignmentsByEmployee, employeeId, tracks]);

  useEffect(() => {
    if (!selectedTrack) {
      setTrackLevelId("");
      return;
    }

    if (selectedTrack.levels.some((level) => level.id === trackLevelId)) {
      return;
    }

    setTrackLevelId(selectedTrack.levels[0]?.id ?? "");
  }, [selectedTrack, trackLevelId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/grow/assignments", {
        method: existingAssignment ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          employeeId,
          trackId,
          trackLevelId,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save track assignment");
      }

      setMessage(existingAssignment ? "Track assignment updated." : "Track assigned.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save track assignment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign employees to track + level</CardTitle>
          <CardDescription>
            Link each employee to the right track baseline so reviews and growth conversations share the same expectations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            data-testid="grow-assignment-form"
          >
            <label className="space-y-1 xl:col-span-4">
              <span className="text-sm font-medium text-slate-700">Filter employees</span>
              <Input
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Search by name, department, title, or manager"
              />
            </label>

            <label className="space-y-1 xl:col-span-2">
              <span className="text-sm font-medium text-slate-700">Employee</span>
              <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
                <option value="">Select employee</option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                    {employee.title ? ` · ${employee.title}` : ""}
                    {employee.department ? ` · ${employee.department}` : ""}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Track</span>
              <Select value={trackId} onChange={(event) => setTrackId(event.target.value)} required>
                <option value="">Select track</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                    {track.isPublished ? "" : " (draft)"}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Level</span>
              <Select
                value={trackLevelId}
                onChange={(event) => setTrackLevelId(event.target.value)}
                required
              >
                <option value="">Select level</option>
                {selectedTrack?.levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    L{level.levelOrder} · {level.name}
                  </option>
                ))}
              </Select>
            </label>

            <div className="flex items-end xl:col-span-4">
              <Button
                type="submit"
                disabled={isSubmitting || !employeeId || !trackId || !trackLevelId}
                data-testid="grow-assignment-submit"
              >
                {isSubmitting
                  ? existingAssignment
                    ? "Saving..."
                    : "Assigning..."
                  : existingAssignment
                    ? "Save assignment"
                    : "Assign track"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current assignments</CardTitle>
          <CardDescription>
            Review the current mapping before phase 4 connects goals, reviews, and evidence to these baselines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {assignments.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No employees have a track assignment yet.
            </div>
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{assignment.employee.name}</p>
                        <p className="text-xs text-slate-500">
                          {[assignment.employee.title, assignment.employee.department]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </TableCell>
                      <TableCell>{assignment.track.name}</TableCell>
                      <TableCell>{assignment.trackLevel.name}</TableCell>
                      <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
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
