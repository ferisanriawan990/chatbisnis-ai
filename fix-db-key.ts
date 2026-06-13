import { PrismaClient } from '@prisma/client';
import { encrypt } from './src/lib/crypto';
const prisma = new PrismaClient();
async function main() {
  const correctKey = "8763886ce871dccba631a7c458c8395341468b054395bb0beec796bbb6673ea3";
  const encrypted = encrypt(correctKey);
  await prisma.chatbotSetting.updateMany({
    data: { whatsappApiKeyEncrypted: encrypted }
  });
  await prisma.whatsappServer.updateMany({
    data: { apiKeyEncrypted: encrypted }
  });
  console.log("Updated API keys in database");
}
main().finally(() => prisma.$disconnect());
