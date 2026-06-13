/*
  Warnings:

  - You are about to drop the column `aiApiKeyEncrypted` on the `ChatbotSetting` table. All the data in the column will be lost.
  - You are about to drop the column `internalWebhookSecret` on the `ChatbotSetting` table. All the data in the column will be lost.
  - You are about to drop the column `n8nWebhookUrl` on the `ChatbotSetting` table. All the data in the column will be lost.
  - You are about to drop the column `allowCustomApiKey` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `allowN8nTemplates` on the `Plan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BusinessBotConfig" DROP CONSTRAINT "BusinessBotConfig_templateId_fkey";

-- AlterTable
ALTER TABLE "BusinessBotConfig" ALTER COLUMN "templateId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "customLinks" TEXT;

-- AlterTable
ALTER TABLE "ChatbotSetting" DROP COLUMN "aiApiKeyEncrypted",
DROP COLUMN "internalWebhookSecret",
DROP COLUMN "n8nWebhookUrl",
ADD COLUMN     "actionWebhookUrl" TEXT,
ADD COLUMN     "allowVision" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "historyMessageCount" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "knowledgeCharLimit" INTEGER NOT NULL DEFAULT 3500;

-- AlterTable
ALTER TABLE "ConversationState" ADD COLUMN     "assignedAdminId" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sentimentScore" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "KnowledgeItem" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "allowCustomApiKey",
DROP COLUMN "allowN8nTemplates";

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessProfileId" TEXT,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantFeatureSetting" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "limitCount" INTEGER,
    "configJson" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantFeatureSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_businessProfileId_idx" ON "Branch"("businessProfileId");

-- CreateIndex
CREATE INDEX "Role_businessProfileId_idx" ON "Role"("businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_userId_idx" ON "UserRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_businessProfileId_idx" ON "UserRoleAssignment"("businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_businessProfileId_roleId_key" ON "UserRoleAssignment"("userId", "businessProfileId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureDefinition_key_key" ON "FeatureDefinition"("key");

-- CreateIndex
CREATE INDEX "TenantFeatureSetting_businessProfileId_idx" ON "TenantFeatureSetting"("businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantFeatureSetting_businessProfileId_featureId_key" ON "TenantFeatureSetting"("businessProfileId", "featureId");

-- CreateIndex
CREATE INDEX "ConversationState_businessProfileId_lastMessageAt_idx" ON "ConversationState"("businessProfileId", "lastMessageAt");

-- AddForeignKey
ALTER TABLE "ConversationState" ADD CONSTRAINT "ConversationState_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessBotConfig" ADD CONSTRAINT "BusinessBotConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BusinessTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFeatureSetting" ADD CONSTRAINT "TenantFeatureSetting_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFeatureSetting" ADD CONSTRAINT "TenantFeatureSetting_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "FeatureDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
