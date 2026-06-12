import { prisma } from './src/lib/prisma.js';

async function fixSession() {
  await prisma.chatbotSetting.updateMany({
    where: { user: { email: 'admin@chatbisnis.id' } },
    data: { wahaSessionName: 'admin-hidden' }
  });
  console.log('Fixed admin session');
}
fixSession().catch(console.error).finally(() => process.exit(0));
