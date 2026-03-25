ALTER TABLE "User"
ADD COLUMN "authIdentityId" TEXT;

CREATE UNIQUE INDEX "User_authIdentityId_key" ON "User"("authIdentityId");
