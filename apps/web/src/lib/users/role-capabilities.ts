import { UserRole } from "@prisma/client";

export function hasHrAdminAccess(role: UserRole): boolean {
  return role === UserRole.HR_ADMIN || role === UserRole.SUPER_ADMIN;
}

export function hasManagerAccess(role: UserRole): boolean {
  return role === UserRole.MANAGER || role === UserRole.SUPER_ADMIN;
}

export function canManageImprovementPlans(role: UserRole): boolean {
  return hasHrAdminAccess(role) || hasManagerAccess(role);
}
