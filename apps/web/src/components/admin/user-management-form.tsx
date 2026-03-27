"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatUserRoleLabel } from "@/lib/users/role-labels";
import type {
  ManagerCandidate,
  UserFormRecord,
} from "@/server/users/user-management-service";

interface UserManagementFormProps {
  auth: {
    userId: string;
    orgId: string;
  };
  mode: "create" | "edit";
  managerOptions: ManagerCandidate[];
  initialUser?: UserFormRecord;
}

export default function UserManagementForm({
  auth,
  mode,
  managerOptions,
  initialUser,
}: UserManagementFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialUser?.firstName ?? "");
  const [lastName, setLastName] = useState(initialUser?.lastName ?? "");
  const [email, setEmail] = useState(initialUser?.email ?? "");
  const [role, setRole] = useState<UserRole>(initialUser?.role ?? UserRole.EMPLOYEE);
  const [department, setDepartment] = useState(initialUser?.department ?? "");
  const [title, setTitle] = useState(initialUser?.title ?? "");
  const [managerEmployeeId, setManagerEmployeeId] = useState(initialUser?.managerEmployeeId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "create" ? "/api/admin/users" : `/api/admin/users/${initialUser?.userId ?? ""}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role,
          department: department.trim() === "" ? null : department,
          title: title.trim() === "" ? null : title,
          managerEmployeeId: managerEmployeeId.trim() === "" ? null : managerEmployeeId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save user");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save user");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Add user" : "Edit user"}</CardTitle>
        <CardDescription>
          Set role, department, title, and reporting manager for assignment workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">First name</span>
            <Input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Last name</span>
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              required
            >
              <option value={UserRole.EMPLOYEE}>Employee</option>
              <option value={UserRole.MANAGER}>Manager</option>
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              <option value={UserRole.HR_ADMIN}>HR Admin</option>
            </Select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Manager</span>
            <Select
              value={managerEmployeeId}
              onChange={(event) => setManagerEmployeeId(event.target.value)}
            >
              <option value="">No manager</option>
              {managerOptions.map((manager) => (
                <option key={manager.employeeId} value={manager.employeeId}>
                  {manager.name} ({formatUserRoleLabel(manager.role)})
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Department</span>
            <Input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="Operations"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Site Supervisor"
            />
          </label>

          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create user"
                  : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
              Cancel
            </Button>
          </div>

          {errorMessage ? (
            <p className="md:col-span-2 text-sm font-medium text-rose-700">{errorMessage}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
