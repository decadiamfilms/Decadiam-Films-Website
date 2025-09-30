-- CreateEnum
CREATE TYPE "public"."TeamSize" AS ENUM ('SOLO', 'SMALL_TEAM', 'MEDIUM_TEAM', 'LARGE_TEAM');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_SUPPLIER', 'SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'INVOICED', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."PriorityLevel" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Australia',
ADD COLUMN     "industryType" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "setupWizardCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "teamSize" "public"."TeamSize";

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "contactPerson" TEXT,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "physicalAddress" JSONB,
    "paymentTerms" TEXT,
    "isLocalGlassSupplier" BOOLEAN NOT NULL DEFAULT false,
    "isApprovedSupplier" BOOLEAN NOT NULL DEFAULT true,
    "performanceRating" DECIMAL(65,30) NOT NULL DEFAULT 5.00,
    "lastOrderDate" TIMESTAMP(3),
    "totalOrdersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "purchaseOrderNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerReference" TEXT,
    "status" "public"."PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "priorityLevel" "public"."PriorityLevel" NOT NULL DEFAULT 'NORMAL',
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "expectedDeliveryDate" TIMESTAMP(3),
    "shippingInstructions" TEXT,
    "internalNotes" TEXT,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "approvalComments" TEXT,
    "supplierConfirmedDate" TIMESTAMP(3),
    "invoiceRequired" BOOLEAN NOT NULL DEFAULT true,
    "invoiceCreated" BOOLEAN NOT NULL DEFAULT false,
    "dispatchBlocked" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderLineItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityOrdered" DECIMAL(65,30) NOT NULL,
    "quantityReceived" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "customModuleType" TEXT,
    "customModuleFlag" BOOLEAN NOT NULL DEFAULT false,
    "specialInstructions" TEXT,
    "lineItemNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderAttachment" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isIncludedWithSupplierOrder" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PurchaseOrderAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderStatusLog" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "statusChangeReason" TEXT,
    "changedBy" TEXT,
    "supplierConfirmationToken" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PurchaseOrderStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalWorkflowRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "orderValueThreshold" DECIMAL(65,30),
    "productCategoryFilter" TEXT,
    "supplierTypeFilter" TEXT,
    "requiredApproverRole" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalWorkflowRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlassType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlassProduct" (
    "id" TEXT NOT NULL,
    "glassTypeId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "thickness" DOUBLE PRECISION NOT NULL,
    "productType" TEXT NOT NULL DEFAULT 'N/A',
    "priceT1" DOUBLE PRECISION NOT NULL,
    "priceT2" DOUBLE PRECISION NOT NULL,
    "priceT3" DOUBLE PRECISION NOT NULL,
    "priceRetail" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlassSupplierPricing" (
    "id" TEXT NOT NULL,
    "glassProductId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierSku" TEXT,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "leadTimeDays" INTEGER,
    "minimumOrder" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassSupplierPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlassQuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "glassTypeId" TEXT NOT NULL,
    "glassProductId" TEXT,
    "thickness" DOUBLE PRECISION NOT NULL,
    "productType" TEXT NOT NULL DEFAULT 'NOT_TOUGHENED',
    "quantity" INTEGER NOT NULL,
    "heightMm" DOUBLE PRECISION NOT NULL,
    "widthMm" DOUBLE PRECISION NOT NULL,
    "itemCode" TEXT,
    "edgework" TEXT,
    "cornerFinish" TEXT,
    "holesAndCutouts" TEXT,
    "services" TEXT,
    "surfaceFinishes" TEXT,
    "pricePerSqm" DOUBLE PRECISION NOT NULL,
    "squareMeters" DOUBLE PRECISION NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "processingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassQuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlassProcessingOption" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "rateType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassProcessingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerGlassPrice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "glassTypeId" TEXT NOT NULL,
    "thickness" DOUBLE PRECISION NOT NULL,
    "customerPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerGlassPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlassTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "glassTypeId" TEXT NOT NULL,
    "thickness" DOUBLE PRECISION NOT NULL,
    "commonSizes" JSONB NOT NULL,
    "defaultProcessing" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_companyId_isApprovedSupplier_idx" ON "public"."Supplier"("companyId", "isApprovedSupplier");

-- CreateIndex
CREATE INDEX "Supplier_isLocalGlassSupplier_isApprovedSupplier_idx" ON "public"."Supplier"("isLocalGlassSupplier", "isApprovedSupplier");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_companyId_supplierCode_key" ON "public"."Supplier"("companyId", "supplierCode");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyId_supplierId_status_idx" ON "public"."PurchaseOrder"("companyId", "supplierId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyId_customerId_priorityLevel_idx" ON "public"."PurchaseOrder"("companyId", "customerId", "priorityLevel");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_createdAt_idx" ON "public"."PurchaseOrder"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_companyId_purchaseOrderNumber_key" ON "public"."PurchaseOrder"("companyId", "purchaseOrderNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderLineItem_purchaseOrderId_idx" ON "public"."PurchaseOrderLineItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLineItem_productId_idx" ON "public"."PurchaseOrderLineItem"("productId");

-- CreateIndex
CREATE INDEX "PurchaseOrderAttachment_purchaseOrderId_idx" ON "public"."PurchaseOrderAttachment"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderStatusLog_purchaseOrderId_timestamp_idx" ON "public"."PurchaseOrderStatusLog"("purchaseOrderId", "timestamp");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowRule_companyId_isActive_idx" ON "public"."ApprovalWorkflowRule"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "GlassType_name_key" ON "public"."GlassType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GlassProduct_sku_key" ON "public"."GlassProduct"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "GlassProduct_glassTypeId_thickness_productType_key" ON "public"."GlassProduct"("glassTypeId", "thickness", "productType");

-- CreateIndex
CREATE UNIQUE INDEX "GlassSupplierPricing_glassProductId_supplierName_key" ON "public"."GlassSupplierPricing"("glassProductId", "supplierName");

-- CreateIndex
CREATE UNIQUE INDEX "GlassProcessingOption_name_key" ON "public"."GlassProcessingOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGlassPrice_customerId_glassTypeId_thickness_key" ON "public"."CustomerGlassPrice"("customerId", "glassTypeId", "thickness");

-- CreateIndex
CREATE UNIQUE INDEX "GlassTemplate_name_key" ON "public"."GlassTemplate"("name");

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLineItem" ADD CONSTRAINT "PurchaseOrderLineItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderLineItem" ADD CONSTRAINT "PurchaseOrderLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderAttachment" ADD CONSTRAINT "PurchaseOrderAttachment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderAttachment" ADD CONSTRAINT "PurchaseOrderAttachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderStatusLog" ADD CONSTRAINT "PurchaseOrderStatusLog_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderStatusLog" ADD CONSTRAINT "PurchaseOrderStatusLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalWorkflowRule" ADD CONSTRAINT "ApprovalWorkflowRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GlassProduct" ADD CONSTRAINT "GlassProduct_glassTypeId_fkey" FOREIGN KEY ("glassTypeId") REFERENCES "public"."GlassType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GlassSupplierPricing" ADD CONSTRAINT "GlassSupplierPricing_glassProductId_fkey" FOREIGN KEY ("glassProductId") REFERENCES "public"."GlassProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GlassQuoteItem" ADD CONSTRAINT "GlassQuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GlassQuoteItem" ADD CONSTRAINT "GlassQuoteItem_glassTypeId_fkey" FOREIGN KEY ("glassTypeId") REFERENCES "public"."GlassType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GlassQuoteItem" ADD CONSTRAINT "GlassQuoteItem_glassProductId_fkey" FOREIGN KEY ("glassProductId") REFERENCES "public"."GlassProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerGlassPrice" ADD CONSTRAINT "CustomerGlassPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerGlassPrice" ADD CONSTRAINT "CustomerGlassPrice_glassTypeId_fkey" FOREIGN KEY ("glassTypeId") REFERENCES "public"."GlassType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GlassTemplate" ADD CONSTRAINT "GlassTemplate_glassTypeId_fkey" FOREIGN KEY ("glassTypeId") REFERENCES "public"."GlassType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
