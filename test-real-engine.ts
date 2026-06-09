import { ChatbotEngine } from './src/lib/chatbot-engine';
import { prisma } from './src/lib/prisma';

async function main() {
  const chatbotSetting = await prisma.chatbotSetting.findFirst();
  console.log("Testing with wahaSessionName:", chatbotSetting!.wahaSessionName);
  const reply = await ChatbotEngine.processMessage({
    wahaSessionName: chatbotSetting!.wahaSessionName,
    customerPhone: "6280000000000",
    customerName: "Test User",
    messageIn: "apa model ai mu?",
    isTest: true
  });
  console.log("Reply:", reply);
}
main().finally(() => prisma.$disconnect());
