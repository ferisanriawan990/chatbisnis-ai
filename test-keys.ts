import { prisma } from './src/lib/prisma';
import { decrypt } from './src/lib/crypto';

async function check() {
  const credentials = await prisma.secretCredential.findMany();
  for (const c of credentials) {
    if (c.key === 'FLAZ_API_KEY_GLOBAL') {
      try {
        console.log('FLAZ_API_KEY_GLOBAL is set, decrypted length:', decrypt(c.encryptedValue).length);
        console.log('Is Active:', c.isActive);
      } catch (e) {
        console.log('Failed to decrypt FLAZ_API_KEY_GLOBAL');
      }
    }
    if (c.key === 'GLOBAL_AI_MODEL') {
      try {
        console.log('GLOBAL_AI_MODEL:', decrypt(c.encryptedValue));
        console.log('Is Active:', c.isActive);
      } catch (e) {
        console.log('Failed to decrypt GLOBAL_AI_MODEL');
      }
    }
  }
}
check();
