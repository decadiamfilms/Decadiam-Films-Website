-- CreateTable
CREATE TABLE "public"."ProductPackage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hasOwnPrice" BOOLEAN NOT NULL DEFAULT false,
    "packagePrice" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FormulaPricing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "formulaName" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "variables" TEXT NOT NULL,

    CONSTRAINT "FormulaPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SKUPattern" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SKUPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPackage_companyId_idx" ON "public"."ProductPackage"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "FormulaPricing_productId_key" ON "public"."FormulaPricing"("productId");

-- CreateIndex
CREATE INDEX "SKUPattern_companyId_usageCount_idx" ON "public"."SKUPattern"("companyId", "usageCount");

-- AddForeignKey
ALTER TABLE "public"."ProductPackage" ADD CONSTRAINT "ProductPackage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageComponent" ADD CONSTRAINT "PackageComponent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."ProductPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormulaPricing" ADD CONSTRAINT "FormulaPricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SKUPattern" ADD CONSTRAINT "SKUPattern_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
