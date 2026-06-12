import { ChatbotEngine } from './src/lib/chatbot-engine.js';
import { prisma } from './src/lib/prisma.js';

async function test() {
  const settings = await prisma.chatbotSetting.findFirst();
  if (!settings) return console.log('No settings');
  
  try {
    const result = await ChatbotEngine.processMessage({
      wahaSessionName: settings.wahaSessionName,
      customerPhone: '6281234567890',
      customerName: 'Tester',
      messageIn: 'Boleh minta gambar tas ransel?',
      isTest: true
    });
    console.log('Result:', result);
  } catch (e) {
    console.error('Process error:', e);
  }
}

test().catch(console.error).finally(() => process.exit(0));
