-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "nodeSpecs" JSONB NOT NULL,
    "roadRules" JSONB NOT NULL,
    "lanePolygons" JSONB NOT NULL,
    "health" JSONB NOT NULL,
    "uptimeSec" INTEGER NOT NULL,
    "firmwareVersion" TEXT,
    "modelVersion" TEXT,
    "lastHeartbeat" TIMESTAMP(3),
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_nodeId_key" ON "Node"("nodeId");
