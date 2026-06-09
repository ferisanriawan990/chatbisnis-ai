require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  try {
    const chatbotSetting = await prisma.chatbotSetting.findFirst();
    if (!chatbotSetting) return console.log("No setting");

    const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
    const globalModel = await prisma.secretCredential.findUnique({ where: { key: 'GLOBAL_AI_MODEL' } });
    
    console.log("Global Key Active:", globalKey?.isActive);
    console.log("Global Model Active:", globalModel?.isActive);

    const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '12345678901234567890123456789012';

    function decrypt(encryptedText) {
      if (!encryptedText) return '';
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText; // not encrypted
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = Buffer.from(parts[2], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_SECRET), iv, { authTagLength: 16 });
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
    }

    let aiModel = chatbotSetting.aiModel || 'gpt-4o-mini';
    if (globalModel && globalModel.isActive) {
      aiModel = decrypt(globalModel.encryptedValue);
      console.log("Decrypted Model from DB:", aiModel);
    }
  } catch (err) {
    console.error(err);
  }
}
main().finally(() => prisma.$disconnect());
