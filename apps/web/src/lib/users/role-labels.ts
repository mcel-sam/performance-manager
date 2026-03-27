import { UserRole } from "@prisma/client";

export function formatUserRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.HR_ADMIN:
      return "HR Admin";
    case UserRole.SUPER_ADMIN:
      return "Super Admin";
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.EMPLOYEE:
    default:
      return "Employee";
  }
}
