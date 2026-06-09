require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  const secrets = await prisma.secretCredential.findMany();
  const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '12345678901234567890123456789012';

  function decrypt(encryptedText) {
    if (!encryptedText) return '';
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText;
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = Buffer.from(parts[2], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_SECRET), iv, { authTagLength: 16 });
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
    } catch(e) { return 'ERROR_DECRYPTING'; }
  }

  for (const s of secrets) {
    console.log(`Key: ${s.key}, IsActive: ${s.isActive}, Decrypted: ${decrypt(s.encryptedValue)}`);
  }
}
main().finally(() => prisma.$disconnect());
