/*
  Warnings:

  - A unique constraint covering the columns `[wahaServerId,wahaSessionName]` on the table `ChatbotSetting` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wahaServerId,sessionName]` on the table `WhatsAppSession` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChatbotSetting_wahaSessionName_key";

-- DropIndex
DROP INDEX "WhatsAppSession_sessionName_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotSetting_wahaServerId_wahaSessionName_key" ON "ChatbotSetting"("wahaServerId", "wahaSessionName");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_wahaServerId_sessionName_key" ON "WhatsAppSession"("wahaServerId", "sessionName");
