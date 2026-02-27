import { ZodError } from "zod";

interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toErrorPayload(error: unknown): { status: number; body: ErrorPayload } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.flatten(),
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    },
  };
}
