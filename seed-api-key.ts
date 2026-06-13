import { PrismaClient } from '@prisma/client';
import { encrypt } from './src/lib/crypto';
import fs from 'fs';

process.env.ENCRYPTION_SECRET = "12345678901234567890123456789012";

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting API Key...');
  const apiKey = 'sk-3zdMBinOpGFCC2Jh2eaE4A';
  const encryptedApiKey = encrypt(apiKey);

  await prisma.secretCredential.upsert({
    where: { key: 'FLAZ_API_KEY_GLOBAL' },
    update: {
      encryptedValue: encryptedApiKey,
      isActive: true,
      lastRotatedAt: new Date()
    },
    create: {
      name: 'Global Flaz Cloud Key',
      key: 'FLAZ_API_KEY_GLOBAL',
      provider: 'Flaz Cloud',
      encryptedValue: encryptedApiKey,
      isActive: true,
      lastRotatedAt: new Date()
    }
  });

  console.log('Inserting Global AI Model...');
  const modelName = 'gemini-2.5-flash-lite';
  const encryptedModel = encrypt(modelName);

  await prisma.secretCredential.upsert({
    where: { key: 'GLOBAL_AI_MODEL' },
    update: {
      encryptedValue: encryptedModel,
      isActive: true,
      lastRotatedAt: new Date()
    },
    create: {
      name: 'Global AI Model',
      key: 'GLOBAL_AI_MODEL',
      provider: 'System',
      encryptedValue: encryptedModel,
      isActive: true,
      lastRotatedAt: new Date()
    }
  });

  console.log('Inserting WhatsApp Server...');
  const whatsappServer = await prisma.whatsappServer.create({
    data: {
      name: 'Baileys Gateway',
      baseUrl: 'http://127.0.0.1:3005', // Default from .env BAILEYS_BASE_URL
      apiKeyEncrypted: encrypt('8763886ce871dccba631a7c458c8395341468b054395bb0beec796bbb6673ea3'),
      status: 'active',
      isActive: true,
      maxSessions: 50,
      currentSessions: 0
    }
  });

  console.log('Success! Created WhatsApp Server:', whatsappServer.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
