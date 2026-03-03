-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_skillId_idx" ON "AuditLog"("skillId");

-- CreateIndex
CREATE INDEX "InstallEvent_skillId_idx" ON "InstallEvent"("skillId");

-- CreateIndex
CREATE INDEX "InstallEvent_timestamp_idx" ON "InstallEvent"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "Skill_installCount_idx" ON "Skill"("installCount" DESC);

-- CreateIndex
CREATE INDEX "Skill_createdAt_idx" ON "Skill"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_authorId_idx" ON "Skill"("authorId");
