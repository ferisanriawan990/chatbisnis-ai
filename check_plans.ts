import { prisma } from './src/lib/prisma.js';

async function check() {
  const users = await prisma.user.findMany({
    include: {
      subscriptions: { include: { plan: true } },
      chatbotSettings: true
    }
  });
  
  for (const u of users) {
    const sub = u.subscriptions.find(s => s.status === 'active');
    const cb = u.chatbotSettings[0];
    console.log(`User: ${u.email}`);
    console.log(`  Plan: ${sub?.plan?.name} (allowCustomKey: ${sub?.plan?.allowCustomApiKey})`);
    console.log(`  Has Custom API Key in DB: ${!!cb?.aiApiKeyEncrypted}`);
    if (cb?.aiApiKeyEncrypted) {
      console.log(`  Last Digits of Encrypted Key: ${cb.aiApiKeyEncrypted.slice(-10)}`);
    }
  }
}
check().catch(console.error).finally(() => process.exit(0));
