/*
  Warnings:

  - Made the column `firmwareVersion` on table `Node` required. This step will fail if there are existing NULL values in that column.
  - Made the column `modelVersion` on table `Node` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Node" ALTER COLUMN "status" SET DEFAULT 'offline',
ALTER COLUMN "lanePolygons" SET DEFAULT '[]',
ALTER COLUMN "uptimeSec" SET DEFAULT 0,
ALTER COLUMN "firmwareVersion" SET NOT NULL,
ALTER COLUMN "firmwareVersion" SET DEFAULT 'unknown',
ALTER COLUMN "modelVersion" SET NOT NULL,
ALTER COLUMN "modelVersion" SET DEFAULT 'unknown',
ALTER COLUMN "lastUpdate" SET DEFAULT CURRENT_TIMESTAMP;
