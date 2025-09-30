-- CreateEnum
CREATE TYPE "public"."TargetMarket" AS ENUM ('TRADIES', 'SME');

-- CreateEnum
CREATE TYPE "public"."ModuleCategory" AS ENUM ('CORE', 'SALES', 'INVENTORY', 'LOGISTICS', 'REPORTING', 'INDUSTRY_SPECIFIC', 'TRADIES');

-- CreateEnum
CREATE TYPE "public"."BillingStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "targetMarket" "public"."TargetMarket" NOT NULL DEFAULT 'TRADIES';

-- CreateTable
CREATE TABLE "public"."available_modules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."ModuleCategory" NOT NULL,
    "monthlyPrice" DECIMAL(65,30) NOT NULL,
    "setupFee" DECIMAL(65,30) DEFAULT 0,
    "targetMarket" "public"."TargetMarket" NOT NULL,
    "features" TEXT[],
    "dependencies" TEXT[],
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "screenshots" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "available_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."module_subscriptions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "monthlyAmount" DECIMAL(65,30) NOT NULL,
    "usageCharges" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."BillingStatus" NOT NULL,
    "billingDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_subscriptions_companyId_moduleId_key" ON "public"."module_subscriptions"("companyId", "moduleId");

-- AddForeignKey
ALTER TABLE "public"."module_subscriptions" ADD CONSTRAINT "module_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_subscriptions" ADD CONSTRAINT "module_subscriptions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."available_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_records" ADD CONSTRAINT "billing_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
