const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
require('dotenv').config();

async function main() {
  const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
  function decrypt(encryptedText) {
      if(!encryptedText) return null;
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = Buffer.from(parts[2], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_SECRET), iv, { authTagLength: 16 });
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
  }
  const s = await prisma.wahaServer.findFirst();
  console.log('WAHA API Key:', decrypt(s?.apiKeyEncrypted));
}
main().finally(()=>prisma.$disconnect());
