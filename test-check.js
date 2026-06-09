const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
require('dotenv').config();

async function main() {
  const g = await prisma.secretCredential.findUnique({where: {key: 'GLOBAL_AI_MODEL'}});
  const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '12345678901234567890123456789012';
  function decrypt(encryptedText) {
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
  console.log("Model:", decrypt(g.encryptedValue));
}
main().finally(()=>prisma.$disconnect());
