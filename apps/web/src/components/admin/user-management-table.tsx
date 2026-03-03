import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import type { UserDirectoryListItem } from "@/server/users/user-management-service";

interface UserManagementTableProps {
  users: UserDirectoryListItem[];
}

const roleTone = {
  HR_ADMIN: "info",
  CALIBRATOR: "warning",
  MANAGER: "success",
  EMPLOYEE: "neutral",
} as const;

export default function UserManagementTable({ users }: UserManagementTableProps) {
  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead># Reports</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.userId}>
              <TableCell>
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-600">{user.email}</p>
              </TableCell>
              <TableCell>
                <StatusChip tone={roleTone[user.role]}>{user.role}</StatusChip>
              </TableCell>
              <TableCell className="text-slate-700">{user.department ?? "—"}</TableCell>
              <TableCell className="text-slate-700">{user.title ?? "—"}</TableCell>
              <TableCell className="text-slate-700">{user.managerName ?? "—"}</TableCell>
              <TableCell className="text-slate-700">{user.reportCount}</TableCell>
              <TableCell>
                <Link href={`/admin/users/${user.userId}`}>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
