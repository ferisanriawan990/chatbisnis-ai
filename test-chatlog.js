const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.chatLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  for (const log of logs) {
    console.log(log.createdAt, log.messageIn, "=>", log.aiUsed);
  }
}
main().finally(()=>prisma.$disconnect());
