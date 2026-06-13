import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogs() {
  const logs = await prisma.chatLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Recent 10 Chat Logs:");
  logs.forEach(log => {
    console.log(`[${log.createdAt.toISOString()}] IN: ${log.messageIn}`);
    console.log(`OUT: ${log.messageOut}`);
    console.log('---');
  });
}

checkLogs().catch(console.error).finally(() => prisma.$disconnect());
