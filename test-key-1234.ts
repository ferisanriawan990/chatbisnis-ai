import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

function decryptStr(encryptedText: string, secret: string): string {
  const key = Buffer.from(secret, 'utf8');
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const ciphertext = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

async function main() {
  const globalCredentials = await prisma.secretCredential.findMany({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
  const globalKey = globalCredentials[0];
  
  const secrets = ["f153356d600686e923a98f0dc5f5f64f", "12345678901234567890123456789012"];
  
  for (const secret of secrets) {
    try {
      console.log(`Trying secret ${secret}...`);
      const decrypted = decryptStr(globalKey.encryptedValue, secret);
      console.log("SUCCESS! Key is:", decrypted);
    } catch(e: any) {
      console.log("Failed:", e.message);
    }
  }
}
main();
