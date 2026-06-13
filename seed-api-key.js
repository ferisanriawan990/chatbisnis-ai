const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

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
  await prisma.whatsappServer.create({
    data: {
      name: 'Baileys Gateway',
      baseUrl: 'http://127.0.0.1:3000',
      status: 'active',
      isActive: true,
      maxSessions: 50,
      currentSessions: 0
    }
  });

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
