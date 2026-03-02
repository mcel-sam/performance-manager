-- CreateIndex
CREATE INDEX "ReviewPacket_orgId_cycleId_snapshotDepartment_snapshotTitle_idx" ON "ReviewPacket"("orgId", "cycleId", "snapshotDepartment", "snapshotTitle");

-- CreateIndex
CREATE INDEX "ReviewPacket_orgId_cycleId_finalRatingSource_idx" ON "ReviewPacket"("orgId", "cycleId", "finalRatingSource");
