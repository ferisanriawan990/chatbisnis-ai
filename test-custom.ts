import { prisma } from './src/lib/prisma';
import { decrypt } from './src/lib/crypto';

async function main() {
  const chatbot = await prisma.chatbotSetting.findFirst({where:{isActive:true}});
  if(chatbot?.aiApiKeyEncrypted) {
    try {
      console.log("Decrypted Custom Key:", decrypt(chatbot.aiApiKeyEncrypted));
    } catch(e:any) {
      console.log("Custom Key Decryption Failed:", e.message);
    }
  }
}
main();
