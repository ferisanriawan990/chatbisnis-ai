import { prisma } from './src/lib/prisma';
import { decrypt } from './src/lib/crypto';

async function testModels() {
  const credentials = await prisma.secretCredential.findUnique({
    where: { key: 'FLAZ_API_KEY_GLOBAL' }
  });
  const key = decrypt(credentials!.encryptedValue);
  const baseUrl = process.env.AI_BASE_URL || 'https://ai.flaz.id/v1';

  const res = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json();
  console.log(data);
}
testModels();
