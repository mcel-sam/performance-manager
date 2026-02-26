import { describe, expect, it, vi } from "vitest";

import { checkDatabaseHealth } from "@/server/health/check-db";

describe("checkDatabaseHealth", () => {
  it("returns ok when database query succeeds", async () => {
    const dbClient = {
      $queryRawUnsafe: vi.fn().mockResolvedValue(1),
    };

    await expect(checkDatabaseHealth(dbClient)).resolves.toEqual({
      ok: true,
      db: "ok",
    });

    expect(dbClient.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it("returns DB_UNREACHABLE when database query fails", async () => {
    const dbClient = {
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error("connection refused")),
    };

    await expect(checkDatabaseHealth(dbClient)).resolves.toMatchObject({
      ok: false,
      db: "error",
      error: {
        code: "DB_UNREACHABLE",
        message: "Database is unreachable",
        details: "connection refused",
      },
    });

    expect(dbClient.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });
});
