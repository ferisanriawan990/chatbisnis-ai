import { prisma } from './src/lib/prisma.js';
import { decrypt } from './src/lib/crypto.js';

async function check() {
  const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
  if (globalKey) {
    try {
      console.log('Global Key decrypted:', decrypt(globalKey.encryptedValue).slice(-10));
    } catch (e) {
      console.error('Decrypt failed:', e);
      console.log('Raw encrypted value:', globalKey.encryptedValue);
    }
  } else {
    console.log('Global Key missing');
  }
}
check().catch(console.error).finally(() => process.exit(0));
