const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ChatbotEngine } = require('./src/lib/chatbot-engine');

async function main() {
  const chatbotSetting = await prisma.chatbotSetting.findFirst({
    where: { botName: 'AI Assistant' }
  });
  if (!chatbotSetting) return console.log("No bot");

  const res = await ChatbotEngine.callAI(chatbotSetting, null, "system prompt test", "hallo", false);
  console.log("Result:", res);
}
main().finally(()=>prisma.$disconnect());
