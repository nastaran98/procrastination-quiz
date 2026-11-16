CREATE TABLE "WorkbookDownload" (
    "id" UUID NOT NULL,
    "archetypeId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkbookDownload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkbookDownload_archetypeId_createdAt_idx" ON "WorkbookDownload"("archetypeId", "createdAt");
CREATE INDEX "WorkbookDownload_createdAt_idx" ON "WorkbookDownload"("createdAt");
