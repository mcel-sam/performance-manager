-- AlterTable
ALTER TABLE "Competency" ADD COLUMN     "themeId" TEXT;

-- CreateTable
CREATE TABLE "CompetencyTheme" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetencyTheme_orgId_idx" ON "CompetencyTheme"("orgId");

-- CreateIndex
CREATE INDEX "CompetencyTheme_orgId_sortOrder_idx" ON "CompetencyTheme"("orgId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyTheme_orgId_slug_key" ON "CompetencyTheme"("orgId", "slug");

-- CreateIndex
CREATE INDEX "Competency_themeId_idx" ON "Competency"("themeId");

-- AddForeignKey
ALTER TABLE "CompetencyTheme" ADD CONSTRAINT "CompetencyTheme_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "CompetencyTheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
