import { prisma } from './src/lib/prisma';
import { decrypt } from './src/lib/crypto';

async function main() {
  const globalCredentials = await prisma.secretCredential.findMany({
    where: { key: 'FLAZ_API_KEY_GLOBAL' },
  });
  const globalKey = globalCredentials[0];
  if (!globalKey) return console.log("No global key found");
  
  const decryptedKey = decrypt(globalKey.encryptedValue);
  console.log("Global Key in DB:", decryptedKey);
}
main();
