import { prisma } from './src/lib/prisma.js';
import { encrypt } from './src/lib/crypto.js';

async function injectKey() {
  const apiKey = process.env.CUSTOM_AI_API_KEY;
  if (!apiKey) throw new Error('CUSTOM_AI_API_KEY environment variable is required');

  const user = await prisma.user.findUnique({ where: { email: 'ferisanriawan@gmail.com' } });
  if (!user) return console.log('User not found');

  const chatbot = await prisma.chatbotSetting.findFirst({ where: { userId: user.id } });
  if (!chatbot) return console.log('Chatbot not found');

  await prisma.chatbotSetting.update({
    where: { id: chatbot.id },
    data: { aiApiKeyEncrypted: encrypt(apiKey), aiModel: 'gpt-4o-mini' },
  });

  console.log('Custom API key updated for ferisanriawan@gmail.com');
}

injectKey().catch(console.error).finally(() => process.exit(0));
