import { prisma } from './src/lib/prisma.js';

async function check() {
  const settings = await prisma.chatbotSetting.findMany({ include: { user: true } });
  for (const s of settings) {
    console.log(`User: ${s.user.email}, DailyLimit: ${s.dailyChatLimit}`);
  }
  const usages = await prisma.usageCounter.findMany();
  console.log('Usages:', usages);
}
check().catch(console.error).finally(() => process.exit(0));
