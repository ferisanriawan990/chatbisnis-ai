import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.chatLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }});
  for (const log of logs) {
    console.log("In:", log.messageIn.substring(0, 50));
    console.log("Out:", log.messageOut);
    console.log("Used:", log.aiUsed);
    console.log("---");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
