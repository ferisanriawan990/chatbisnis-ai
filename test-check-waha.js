const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.wahaServer.findFirst();
  console.log('WAHA Base URL:', s?.baseUrl);
  const c = await prisma.chatbotSetting.findFirst();
  console.log('Bot Webhook URL (Internal):', c?.internalWebhookSecret);
}
main().finally(()=>prisma.$disconnect());
