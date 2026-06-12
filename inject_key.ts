import { prisma } from './src/lib/prisma.js';
import { encrypt } from './src/lib/crypto.js';

async function injectKey() {
  const user = await prisma.user.findUnique({ where: { email: 'ferisanriawan@gmail.com' } });
  if (!user) return console.log('User not found');

  const cb = await prisma.chatbotSetting.findFirst({ where: { userId: user.id } });
  if (!cb) return console.log('Chatbot not found');

  const encryptedKey = encrypt('sk-8IlFhbWOaXqJMgkZLTGyqA');

  await prisma.chatbotSetting.update({
    where: { id: cb.id },
    data: { aiApiKeyEncrypted: encryptedKey, aiModel: 'gpt-4o-mini' }
  });

  console.log('Custom API Key injected into ferisanriawan@gmail.com');
}
injectKey().catch(console.error).finally(() => process.exit(0));
