/*
  Warnings:

  - A unique constraint covering the columns `[whatsappServerId,whatsappSessionName]` on the table `ChatbotSetting` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[whatsappServerId,sessionName]` on the table `WhatsAppSession` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChatbotSetting_whatsappSessionName_key";

-- DropIndex
DROP INDEX "WhatsAppSession_sessionName_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotSetting_whatsappServerId_whatsappSessionName_key" ON "ChatbotSetting"("whatsappServerId", "whatsappSessionName");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_whatsappServerId_sessionName_key" ON "WhatsAppSession"("whatsappServerId", "sessionName");
