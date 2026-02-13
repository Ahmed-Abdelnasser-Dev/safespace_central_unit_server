-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "accidentPolygon" JSONB NOT NULL,
    "mediaUrls" JSONB NOT NULL,
    "severityLevel" INTEGER NOT NULL,
    "blockedLanes" JSONB NOT NULL,
    "laneConfiguration" TEXT NOT NULL,
    "originalSpeedLimit" INTEGER NOT NULL,
    "adjustedSpeedLimit" INTEGER NOT NULL,
    "adminDecision" TEXT,
    "adminDecisionTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Incident_incidentId_key" ON "Incident"("incidentId");

-- CreateIndex
CREATE INDEX "Incident_nodeId_idx" ON "Incident"("nodeId");

-- CreateIndex
CREATE INDEX "Incident_createdAt_idx" ON "Incident"("createdAt");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("nodeId") ON DELETE RESTRICT ON UPDATE CASCADE;
