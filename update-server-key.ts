import { PrismaClient } from '@prisma/client';
import { aesGcmEncrypt } from './src/lib/encryption.ts';

const prisma = new PrismaClient();

async function main() {
  const servers = await prisma.whatsappServer.findMany();
  for (const server of servers) {
    if (server.baseUrl && server.baseUrl.includes('202.155.157.219')) {
      const correctKey = '8763886ce871dccba631a7c458c8395341468b054395bb0beec796bbb6673ea3';
      const encrypted = await aesGcmEncrypt(correctKey, process.env.ENCRYPTION_SECRET);
      await prisma.whatsappServer.update({
        where: { id: server.id },
        data: { apiKey: encrypted }
      });
      console.log('Updated server API key successfully to the correct VPS API key!');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
