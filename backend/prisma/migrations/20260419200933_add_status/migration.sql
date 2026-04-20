-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
