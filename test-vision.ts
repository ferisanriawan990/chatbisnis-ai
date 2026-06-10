import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { decrypt } from './src/lib/crypto';
const prisma = new PrismaClient();

async function main() {
  const globalKey = await prisma.secretCredential.findUnique({ where: { key: 'FLAZ_API_KEY_GLOBAL' } });
  if (!globalKey || !globalKey.isActive) return console.log('No key');
  const apiKey = decrypt(globalKey.encryptedValue);

  const body = {
    model: 'gemini/gemini-2.5-flash-lite',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What color is the image?' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' } }
        ]
      }
    ]
  };

  const res = await fetch('https://ai.flaz.id/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  
  const text = await res.text();
  console.log("Response:", res.status, text);
}
main().catch(console.error).finally(() => prisma.$disconnect());
