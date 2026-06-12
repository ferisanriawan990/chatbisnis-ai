import { prisma } from './src/lib/prisma.js';
import { decrypt } from './src/lib/crypto.js';

async function testWebhookQuery() {
  const chatbotSetting = await prisma.chatbotSetting.findFirst({
    where: { 
      wahaServerId: 'bd809b58-b1d5-4c3c-8139-8c0b51d9ba12',
      isActive: true,
      user: {
        subscriptions: {
          some: { status: 'active' }
        }
      }
    },
    include: { user: true }
  });
  
  if (!chatbotSetting) {
    console.log("NO CHATBOT FOUND");
    return;
  }

  console.log(`Found User: ${chatbotSetting.user.email}`);
  console.log(`Model: ${chatbotSetting.aiModel}`);
  console.log(`Provider: ${chatbotSetting.aiProvider}`);
  
  if (chatbotSetting.aiApiKeyEncrypted) {
    try {
      console.log(`Key: ${decrypt(chatbotSetting.aiApiKeyEncrypted).slice(-10)}`);
    } catch(e) {
      console.log(`Key Decrypt Failed`);
    }
  } else {
    console.log(`Key: null`);
  }
}

testWebhookQuery().catch(console.error).finally(() => process.exit(0));
