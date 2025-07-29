-- CreateTable
CREATE TABLE "public"."Sponsor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "subscriptionTier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "sponsorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "quotaGpt" INTEGER NOT NULL DEFAULT 0,
    "quotaFetch" INTEGER NOT NULL DEFAULT 0,
    "accessCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_email_key" ON "public"."Sponsor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_stripeCustomerId_key" ON "public"."Sponsor"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_code_key" ON "public"."AccessCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "public"."User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_accessCodeId_key" ON "public"."User"("accessCodeId");

-- AddForeignKey
ALTER TABLE "public"."AccessCode" ADD CONSTRAINT "AccessCode_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "public"."Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_accessCodeId_fkey" FOREIGN KEY ("accessCodeId") REFERENCES "public"."AccessCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
