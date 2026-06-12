import { prisma } from './src/lib/prisma.js';
import { decrypt } from './src/lib/crypto.js';

async function checkSessions() {
  const settings = await prisma.chatbotSetting.findMany({ include: { user: true } });
  for (const s of settings) {
    let key = '<none>';
    if (s.aiApiKeyEncrypted) {
      try {
        key = decrypt(s.aiApiKeyEncrypted).slice(-10);
      } catch (e) {
        key = '<decrypt-fail>';
      }
    }
    console.log(`User: ${s.user.email} | Session: ${s.wahaSessionName} | Key: ${key}`);
  }
}
checkSessions().catch(console.error).finally(() => process.exit(0));
