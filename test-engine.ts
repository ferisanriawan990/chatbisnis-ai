import { prisma } from './src/lib/prisma';
import { decrypt } from './src/lib/crypto';
import { ChatbotEngine } from './src/lib/chatbot-engine';

async function main() {
  console.log("Checking credentials in DB...");
  const globalCredentials = await prisma.secretCredential.findMany({
    where: { key: 'FLAZ_API_KEY_GLOBAL' },
  });
  
  if (globalCredentials.length === 0) {
    console.log("No global key found in DB");
  } else {
    for (const globalKey of globalCredentials) {
      try {
        const decryptedKey = decrypt(globalKey.encryptedValue);
        console.log("Global Key Decrypted successfully! Starts with sk-:", decryptedKey.startsWith("sk-"), decryptedKey.substring(0, 8));
      } catch (e: any) {
        console.log("Global Key Decryption failed:", e.message);
      }
    }
  }

  console.log("\nTesting ChatbotEngine.processMessage...");
  try {
    const chatbot = await prisma.chatbotSetting.findFirst({ where: { isActive: true } });
    if (!chatbot) return console.log("No active chatbot found");
    
    const res = await ChatbotEngine.processMessage({
      wahaSessionName: chatbot.wahaSessionName,
      customerPhone: '32311072575717@lid',
      messageIn: 'halo',
    });
    console.log("processMessage result:");
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error("Engine crash:", e);
  }
}
main();
