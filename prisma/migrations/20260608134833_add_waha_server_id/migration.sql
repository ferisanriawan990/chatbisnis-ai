-- AlterTable
ALTER TABLE "ChatbotSetting" ADD COLUMN     "whatsappServerId" TEXT;

-- AlterTable
ALTER TABLE "WhatsAppSession" ADD COLUMN     "whatsappServerId" TEXT;

-- AddForeignKey
ALTER TABLE "ChatbotSetting" ADD CONSTRAINT "ChatbotSetting_whatsappServerId_fkey" FOREIGN KEY ("whatsappServerId") REFERENCES "WhatsappServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppSession" ADD CONSTRAINT "WhatsAppSession_whatsappServerId_fkey" FOREIGN KEY ("whatsappServerId") REFERENCES "WhatsappServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
