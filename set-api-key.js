const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Keep same logic as src/lib/crypto.ts
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function encrypt(text) {
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function main() {
  try {
    const apiKey = 'sk-3zdMBinOpGFCC2Jh2eaE4A';
    const encryptedApiKey = encrypt(apiKey);

    const existingCred = await prisma.globalCredential.findFirst({
      where: { key: 'FLAZ_API_KEY_GLOBAL' },
    });

    if (existingCred) {
      await prisma.globalCredential.update({
        where: { id: existingCred.id },
        data: { encryptedValue: encryptedApiKey, isActive: true },
      });
      console.log('Successfully updated existing FLAZ_API_KEY_GLOBAL');
    } else {
      await prisma.globalCredential.create({
        data: {
          key: 'FLAZ_API_KEY_GLOBAL',
          provider: 'Flaz Cloud',
          type: 'API_KEY',
          encryptedValue: encryptedApiKey,
          isActive: true,
        },
      });
      console.log('Successfully created new FLAZ_API_KEY_GLOBAL');
    }

    // Explicitly set the global model as well
    const defaultModel = 'gemini-2.5-flash-lite';
    const encryptedModel = encrypt(defaultModel);

    const existingModel = await prisma.globalCredential.findFirst({
      where: { key: 'GLOBAL_AI_MODEL' },
    });

    if (existingModel) {
      await prisma.globalCredential.update({
        where: { id: existingModel.id },
        data: { encryptedValue: encryptedModel, isActive: true },
      });
      console.log('Successfully updated existing GLOBAL_AI_MODEL to gemini-2.5-flash-lite');
    } else {
      await prisma.globalCredential.create({
        data: {
          key: 'GLOBAL_AI_MODEL',
          provider: 'Flaz Cloud',
          type: 'CONFIG',
          encryptedValue: encryptedModel,
          isActive: true,
        },
      });
      console.log('Successfully created new GLOBAL_AI_MODEL as gemini-2.5-flash-lite');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
