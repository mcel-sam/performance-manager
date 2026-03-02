import { UserRole } from "@prisma/client";

export const demoOrgId = "org_demo_1";
export const demoCycleId = "cycle_seed_draft_1";
export const demoTemplateId = "template_default_1";
export const demoCalibrationSessionId = "calibration_session_seed_1";
export const demoImprovementPlanId = "improvement_plan_seed_1";

export const demoPrimaryRoleUserByRole: Record<UserRole, string> = {
  [UserRole.HR_ADMIN]: "user_hr_admin_1",
  [UserRole.CALIBRATOR]: "user_calibrator_1",
  [UserRole.MANAGER]: "user_manager_1",
  [UserRole.EMPLOYEE]: "user_employee_1",
} as const;
