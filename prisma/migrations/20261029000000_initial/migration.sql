CREATE TABLE "Visitor" (
  "id" UUID NOT NULL,
  "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Assessment" (
  "id" UUID NOT NULL,
  "visitorId" UUID NOT NULL,
  "status" TEXT NOT NULL,
  "primary" TEXT,
  "secondary" TEXT,
  "completed" INTEGER NOT NULL,
  "scores" JSONB NOT NULL,
  "answers" JSONB NOT NULL,
  "followUps" JSONB NOT NULL,
  "followUpCount" INTEGER NOT NULL DEFAULT 0,
  "scoringVersion" TEXT NOT NULL DEFAULT '1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Assessment_visitorId_idx" ON "Assessment"("visitorId");
CREATE INDEX "Assessment_createdAt_idx" ON "Assessment"("createdAt");
CREATE INDEX "Assessment_primary_idx" ON "Assessment"("primary");
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
