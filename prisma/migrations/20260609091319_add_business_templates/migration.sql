-- CreateTable
CREATE TABLE "BusinessTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "requiredFields" TEXT NOT NULL,
    "sampleQuestions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessBotConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessDescription" TEXT NOT NULL,
    "productsOrServices" TEXT,
    "pricingInfo" TEXT,
    "operationalHours" TEXT,
    "address" TEXT,
    "serviceArea" TEXT,
    "paymentMethods" TEXT,
    "deliveryMethods" TEXT,
    "humanAdminContact" TEXT,
    "catalogUrl" TEXT,
    "mapsUrl" TEXT,
    "customFAQ" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'sopan',
    "languageStyle" TEXT NOT NULL DEFAULT 'id',
    "botMode" TEXT NOT NULL DEFAULT 'auto_reply',
    "isBotActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessBotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessTemplate_slug_key" ON "BusinessTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessBotConfig_userId_key" ON "BusinessBotConfig"("userId");

-- AddForeignKey
ALTER TABLE "BusinessBotConfig" ADD CONSTRAINT "BusinessBotConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessBotConfig" ADD CONSTRAINT "BusinessBotConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BusinessTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
