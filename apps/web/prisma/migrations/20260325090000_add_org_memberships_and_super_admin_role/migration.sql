ALTER TYPE "UserRole" RENAME VALUE 'CALIBRATOR' TO 'SUPER_ADMIN';

CREATE TABLE "OrgMembership" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrgMembership_orgId_userId_key" ON "OrgMembership"("orgId", "userId");
CREATE INDEX "OrgMembership_orgId_role_idx" ON "OrgMembership"("orgId", "role");
CREATE INDEX "OrgMembership_orgId_isActive_idx" ON "OrgMembership"("orgId", "isActive");
CREATE INDEX "OrgMembership_userId_idx" ON "OrgMembership"("userId");

INSERT INTO "OrgMembership" ("id", "orgId", "userId", "role", "isActive", "createdAt", "updatedAt")
SELECT
  CONCAT('membership_', "id"),
  "orgId",
  "id",
  "role",
  true,
  "createdAt",
  "updatedAt"
FROM "User"
ON CONFLICT ("orgId", "userId") DO UPDATE
SET
  "role" = EXCLUDED."role",
  "isActive" = true,
  "updatedAt" = EXCLUDED."updatedAt";

ALTER TABLE "OrgMembership"
ADD CONSTRAINT "OrgMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrgMembership"
ADD CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
