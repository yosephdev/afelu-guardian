-- AlterTable
ALTER TABLE "public"."AccessCode" ADD COLUMN     "usedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "public"."UsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageLog_userId_createdAt_idx" ON "public"."UsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageLog_action_createdAt_idx" ON "public"."UsageLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
