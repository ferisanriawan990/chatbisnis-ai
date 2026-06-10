import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.chatLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  for (const log of logs) {
    console.log(`[${log.createdAt.toISOString()}] In: ${log.messageIn.substring(0,50)} | Out: ${log.messageOut?.substring(0,50)}`);
    console.log(`   AI: ${log.aiUsed} | Tokens: ${log.tokenUsage}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
