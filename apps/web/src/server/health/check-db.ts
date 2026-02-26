import { prisma } from "@/server/db/prisma";

type DbClient = Pick<typeof prisma, "$queryRawUnsafe">;

export interface HealthSuccessResponse {
  ok: true;
  db: "ok";
}

export interface HealthErrorResponse {
  ok: false;
  db: "error";
  error: {
    code: "DB_UNREACHABLE";
    message: string;
    details?: string;
  };
}

export type HealthResponse = HealthSuccessResponse | HealthErrorResponse;

export async function checkDatabaseHealth(
  dbClient: DbClient = prisma,
): Promise<HealthResponse> {
  try {
    await dbClient.$queryRawUnsafe("SELECT 1");

    return {
      ok: true,
      db: "ok",
    };
  } catch (error) {
    return {
      ok: false,
      db: "error",
      error: {
        code: "DB_UNREACHABLE",
        message: "Database is unreachable",
        details: error instanceof Error ? error.message : "Unknown database error",
      },
    };
  }
}
