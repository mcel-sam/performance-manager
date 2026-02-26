export type UserRole = "EMPLOYEE" | "MANAGER" | "HR_ADMIN" | "CALIBRATOR";

export interface HealthSuccessResponse {
  ok: true;
  db: "ok";
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface HealthErrorResponse {
  ok: false;
  db: "error";
  error: ErrorPayload;
}
