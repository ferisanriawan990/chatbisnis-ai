import { ChatbotEngine } from './src/lib/chatbot-engine';
import { prisma } from './src/lib/prisma';

async function test() {
  console.log('Testing ChatbotEngine...');
  
  const chatbotSetting = await prisma.chatbotSetting.findFirst();
  const profile = await prisma.businessProfile.findFirst({ where: { id: chatbotSetting?.businessProfileId } });

  const result = await ChatbotEngine.processMessage({
    wahaSessionName: chatbotSetting?.wahaSessionName || 'test',
    customerPhone: '6281234567890',
    messageIn: 'saya minta gambar produk'
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

test()
  .catch(console.error)
  .finally(() => process.exit(0));
