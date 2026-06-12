import { ChatbotEngine } from './src/lib/chatbot-engine';
import { prisma } from './src/lib/prisma';

async function main() {
  console.log("Testing processMessage...");
  const chatbot = await prisma.chatbotSetting.findFirst();
  if(!chatbot) return console.log('no chatbot');
  
  const res = await ChatbotEngine.processMessage({
    wahaSessionName: chatbot.wahaSessionName,
    customerPhone: '32311072575717@lid',
    messageIn: 'halo',
  });
  console.log(res);
}
main();
