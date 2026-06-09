import { PrismaClient } from '@prisma/client';
import { ChatbotEngine } from './src/lib/chatbot-engine';
const prisma = new PrismaClient();

async function main() {
  const chatbotSetting = await prisma.chatbotSetting.findFirst({
    where: { botName: 'AI Assistant' }
  });
  if (!chatbotSetting) return console.log("No bot");

  const res = await (ChatbotEngine as any).callAI(chatbotSetting, null, "system prompt test", "hallo", false);
  console.log("Result:", res);
}
main().finally(()=>prisma.$disconnect());
