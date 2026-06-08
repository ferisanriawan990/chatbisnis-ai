-- AlterTable
ALTER TABLE "ChatbotSetting" ADD COLUMN     "wahaServerId" TEXT;

-- AlterTable
ALTER TABLE "WhatsAppSession" ADD COLUMN     "wahaServerId" TEXT;

-- AddForeignKey
ALTER TABLE "ChatbotSetting" ADD CONSTRAINT "ChatbotSetting_wahaServerId_fkey" FOREIGN KEY ("wahaServerId") REFERENCES "WahaServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppSession" ADD CONSTRAINT "WhatsAppSession_wahaServerId_fkey" FOREIGN KEY ("wahaServerId") REFERENCES "WahaServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
