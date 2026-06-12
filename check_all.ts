import { prisma } from './src/lib/prisma.js';

async function checkAll() {
  const settings = await prisma.chatbotSetting.findMany({
    select: {
      id: true,
      userId: true,
      wahaSessionName: true,
      aiApiKeyEncrypted: true,
      isActive: true,
      user: { select: { email: true } }
    }
  });
  console.log(JSON.stringify(settings, null, 2));
}
checkAll().catch(console.error).finally(() => process.exit(0));
